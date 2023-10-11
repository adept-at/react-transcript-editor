import React, { useCallback, useState } from 'react';

import { ContentBlock, ContentState, Editor, EditorState, convertFromRaw } from 'draft-js';
import { TranscriptBlock } from './TranscriptDraftjsBlock';

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
    onSave: () => void;
    settings: TranscriptSettings;
}

// In reality this is just a DraftJS block?
// It would seem that we just wire up all of our stuff to that...
// best place to start is to simply display a DraftJS Editor
export const TimedTranscriptEditor: React.FC<TranscriptEditorProps> = (props: TranscriptEditorProps) => {
    // Settings is state managed by something else...
    const { settings, transcripts, onWordClick, onSave } = props;

    // VTT Files are showing up as Raw DraftJS ContentState
    const initialContentState = convertFromRaw(transcripts);

    const [editorState, updateEditorState] = useState(EditorState.createWithContent(initialContentState));

    const blockRenderer = useCallback(() => {
        return {
            component: TranscriptBlock,
            editable: true,
            // This should be the input for our render?
            props: {
                settings,
                onWordClick,
                onSave,
                editorState
            }
        }
    }, [settings]);

    // So on change here fires when internal state is created...
    // Ideally we just keep track of our Content State, and auto save if enabled - or
    return (
        <Editor
            editorState={editorState}
            onChange={(change) => console.log('On change!')}
            spellCheck={true}
            blockRendererFn={blockRenderer}
        />
    );
};