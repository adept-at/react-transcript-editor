import React, { useCallback, useState, KeyboardEvent } from 'react';

import {
    ContentBlock,
    ContentState,
    Editor,
    EditorState,
    RawDraftContentState,
    convertFromRaw,
    convertToRaw,
    getDefaultKeyBinding
} from 'draft-js';

import { TranscriptBlock } from './TranscriptDraftjsBlock';
import { updateTimestamps } from './vttConvert/decorateDraftForVtt';
import { convertToDigitalPaperEdit } from './vttConvert/draftjs-to-digital-paper-edit';
import subtitlesGenerator from './vttConvert/subtitles-generator';

/**
 * FYI: Here is the standard for WebVTT files:
 * https://www.w3.org/TR/webvtt1/
 */

export interface TranscriptSettings {
    timecodes: boolean;
    speakerNames: boolean;
    spellCheck: boolean;
    isEditable: boolean;
    autoSave: boolean;
    autoSaveDelayMs: number;
}

interface TranscriptEditorProps {
    // Our Transcript
    transcripts: any;
    onWordClick: (word: string) => void;
    onSave: (vttTranscripts: any, draftjs: any) => void;
    settings: TranscriptSettings;
}

// Data conversion is courtesy of original author.
function convertCaptionsToVTT(editorState: EditorState) {
    const rawDraftBlob = convertToRaw(editorState.getCurrentContent());

    const { words: vttWords } = convertToDigitalPaperEdit(rawDraftBlob);

    // 32 seems to be the max recommend characters per transcript display.
    const vttContent = subtitlesGenerator({ words: vttWords, type: 'vtt', numberOfCharPerLine: 32 });

    return { data: vttContent, ext: 'vtt' };
}

export const TimedTranscriptEditor: React.FC<TranscriptEditorProps> = (props: TranscriptEditorProps) => {
    // Settings is state managed by the parent component and updates trickle in.
    const { settings, transcripts, onWordClick, onSave } = props;

    // Our "getCaptionAsset" hook logic loads the VTT file into
    // a raw DraftJS format.
    const [initialContentState, _updateInitialContentState] = useState(transcripts);
    const [editorState, updateEditorState] = useState(
        EditorState.createWithContent(convertFromRaw(initialContentState))
    );
    const [shouldSave, setShouldSave] = useState(false);

    // Custom logic to display our Transcript blocks..
    const blockRenderer = useCallback(() => {
        return {
            component: TranscriptBlock,
            editable: true,
            // This should be the input for our render?
            props: {
                settings,
                editorState,
                onWordClick,
                updateEditorState
            }
        };
    }, [settings, editorState, updateEditorState]);

    // No custom keybinds yet.
    const keyBindingFn = (e: KeyboardEvent) => getDefaultKeyBinding(e);

    /**
     * Calculate new timestamps for added/removed words
     */
    const updateTimestampsForEditorState = useCallback(() => {
        const currentContent = convertToRaw(editorState.getCurrentContent());
        const updatedContentRaw = updateTimestamps(currentContent, initialContentState);
        const updatedContent = convertFromRaw(updatedContentRaw);

        // Update editor state
        const newEditorState = EditorState.push(editorState, updatedContent, 'change-block-data');

        // Re-convert updated content to raw to gain access to block keys
        const updatedContentBlocks = convertToRaw(updatedContent);

        // Get current selection state and update block keys
        const selectionState = editorState.getSelection();

        // Check if editor has currently the focus. If yes, keep current selection.
        if (selectionState.getHasFocus()) {
            // Build block map, which maps the block keys of the previous content to the block keys of the
            // updated content.
            const blockMap: Record<string, any> = {};
            for (let blockIdx = 0; blockIdx < currentContent.blocks.length; blockIdx++) {
                blockMap[currentContent.blocks[blockIdx].key] = updatedContentBlocks.blocks[blockIdx].key;
            }

            const selection = selectionState.merge({
                anchorOffset: selectionState.getAnchorOffset(),
                anchorKey: blockMap[selectionState.getAnchorKey()],
                focusOffset: selectionState.getFocusOffset(),
                focusKey: blockMap[selectionState.getFocusKey()]
            });

            // Set the updated selection state on the new editor state
            const newEditorStateSelected = EditorState.forceSelection(newEditorState, selection);
            //this.setState({ editorState: newEditorStateSelected });

            updateEditorState(newEditorStateSelected);
            return newEditorStateSelected;
        } else {
            updateEditorState(newEditorState);
            return newEditorState;
        }
    }, [editorState, initialContentState]);

    // Refresh our save internal, as long as editor state is changing and Autosave is enabled..
    React.useEffect(() => {
        if (!settings.autoSave || !shouldSave) return;

        const timer = setTimeout(() => {
            // Convert state to VTT and save.
            const updatedState = updateTimestampsForEditorState();

            const vttForCaptions = convertCaptionsToVTT(updatedState);
            const rawDraft = convertToRaw(updatedState.getCurrentContent());
            onSave(vttForCaptions.data, rawDraft);
            console.log('Saving...', rawDraft, vttForCaptions.data);
        }, settings.autoSaveDelayMs);

        return () => clearTimeout(timer);
    }, [updateTimestampsForEditorState, shouldSave, settings]);

    // This fires any time something is modified however - onSave() should only be invoked
    // every settings.autoSaveDelayMs
    const onChange = (updatedState: EditorState) => {
        setShouldSave(prev => !prev); // Dont save until we've made at least one change.
        updateEditorState(updatedState);
    };

    // So on change here fires when internal state is created...
    // Ideally we just keep track of our Content State, and auto save if enabled - or
    // unused until hotkeys/shortcuts
    //            handleKeyCommand
    return (
        <Editor
            editorState={editorState}
            onChange={onChange}
            spellCheck={true}
            blockRendererFn={blockRenderer}
            keyBindingFn={keyBindingFn}
        />
    );
};
