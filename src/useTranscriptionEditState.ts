import { createRef, useState } from "react";

interface TranscriptionEditState {
      currentTime: number;
      // TODO: Type for this?
      transcriptData: any,
      isScrollIntoViewOn: boolean;
      showSettings: boolean;
      showShortcuts: boolean;
      isPauseWhileTypingOn: boolean;
      rollBackValueInSeconds: number;
      timecodeOffset: number,
      showTimecodes: boolean;
      showSpeakers: boolean;
      previewIsDisplayed: boolean;
      gridDisplay: any;
      mediaDuration: string; //"00:00:00:00",
}

const DEFAULT_STATE: TranscriptionEditState = {
    currentTime: 0,
      transcriptData: null,
      isScrollIntoViewOn: false,
      showSettings: false,
      showShortcuts: false,
      isPauseWhileTypingOn: true,
      rollBackValueInSeconds: 15,
      timecodeOffset: 0,
      showTimecodes: true,
      showSpeakers: true,
      previewIsDisplayed: true,
      mediaDuration: "00:00:00:00",
      gridDisplay: null,
};

export const useTranscriptionEditState = () => {
    const [transcriptionState, updateTranscriptionState] = useState(DEFAULT_STATE);

    const timedTextEditorRef = createRef();

};