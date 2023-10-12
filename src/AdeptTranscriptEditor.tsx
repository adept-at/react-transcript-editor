import React, { createRef } from 'react';
import { TimedTranscriptEditor } from './components/TimedTextEditor';


interface AdeptTranscriptEditorProps {
    // Certain on these:
    mediaType?: 'video' | 'audio'
    transcriptData: any;
    videoRef: React.RefObject<HTMLVideoElement>;
    saveEdits: (vttTranscripts: any, draftjs: any) => void;
    // URL to playback Media from.
    mediaUrl?: string;
    title: string;
    onClick: () => void;
    isEditable: boolean;
    // Not required really.
    spellCheck?: boolean;
    fileName?: string;
};

export const AdeptTranscriptEditor: React.FC<AdeptTranscriptEditorProps> = (props: AdeptTranscriptEditorProps) => {
    const { transcriptData, videoRef, saveEdits } = props;
    /**
     * So we need to create our Adept Transcript Editor State...
     * Its possible our state is not as simple as we think... and instead we need
     * to individually manage states directly in here.
     */
    const timedTextEditorRef = createRef();

    const settings = {
        timecodes: true,
        speakerNames: true,
        spellCheck: true,
        isEditable: true,
        autoSave: true,
        autoSaveDelayMs: 5000
    };
    /* Manage our dimensions based on the presence of Media URL or not? */

    const [shouldAutosave, updateShouldAutosave] = React.useState(false);

    /*
    setInterval(() => {
    }, settings.autoSaveDelayMs);
    */
    /**
     * We want to return:
     * Video Player -> We just want the ref, and use our own controls to update time, etc...
     * Media Player
     * Settings
     * Shortcuts
     * TimedTextEditor
     * <Header> - contains "settings", "shortcuts", and controls.
     */

    // We should display a "header" with settings, shortcuts, and save state/button?
    // Right now we JUST have the editor.. build out other componenets independently and show here.
    return <TimedTranscriptEditor
        transcripts={transcriptData}
        settings={settings}
        onWordClick={() => console.log('word clicked!')}
        onSave={saveEdits}
    />;
};