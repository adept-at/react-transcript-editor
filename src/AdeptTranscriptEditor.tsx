import React, { createRef } from 'react';
import { TimedTranscriptEditor } from './components/TimedTextEditor';

interface AdeptTranscriptEditorProps {
    transcriptData: any;
    // Video to be controlled.
    videoRef: React.RefObject<HTMLVideoElement>;
    // URL to playback Media from.
    mediaUrl?: string;
    title: string;
    onClick: () => void;
    isEditable: boolean;
    // Not required really.
    spellCheck?: boolean;
    fileName?: string;
    mediaType?: 'video' | 'audio'
};

export const AdeptTranscriptEditor: React.FC<AdeptTranscriptEditorProps> = ({
    transcriptData,
    videoRef,
    title,
    onClick,
    isEditable,
    mediaUrl,
    mediaType
}: AdeptTranscriptEditorProps) => {
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

    /**
     *  Need a way to update the time of the video when a word is double clicked.
     */

    // Show speakers,
    // settings toggle
    // shortcuts toggle

    /**
     * We want to return:
     * Video Player -> We just want the ref, and use our own controls to update time, etc...
     * Media Player
     * Settings
     * Shortcuts
     * TimedTextEditor
     * <Header> - contains "settings", "shortcuts", and controls.
     */

    // What is the best way to do this incrementally? I feel like we could start at the beginning and then slowly just drill donw...
    // Do we even need a "media player"? Or can we just rely entirely on the Video
    // player already gifted to us.
    // Just start displaying the captions in a "Container".

    return <TimedTranscriptEditor
        transcripts={transcriptData}
        settings={settings}
        onWordClick={() => console.log('word clicked!')}
        onSave={() => console.log('save!')}
    />;
};