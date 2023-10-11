import React, { useCallback, useState } from 'react';

import { Editor, EditorState } from 'draft-js';
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
    transcripts: string;
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

    console.log('settings and transcripts', settings, transcripts);

    // the above "component" can control settings and pass them in here
    // so how does one create a DraftJS Editor state?
    const [editorState, updateEditorState] = useState(EditorState.createEmpty());

    const blockRenderer = useCallback(() => {
        return {
            component: TranscriptBlock,
            editable: true,
            // This should be the input for our render?
            props: {
                settings,
                onWordClick,
                onSave,
                transcripts
            }
        }
    }, [settings]);

    return (
        <Editor
            editorState={editorState}
            onChange={(change) => console.log('On change!')}
            spellCheck={true}
            blockRendererFn={blockRenderer}
        />
    );
};