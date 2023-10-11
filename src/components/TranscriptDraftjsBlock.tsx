import { 
  EditorBlock, 
  Modifier, 
  EditorState, 
  SelectionState,
  convertFromRaw,
  convertToRaw
 } from 'draft-js';
import React from 'react';

import styled from 'styled-components';


import { faUser, faUserEdit } from '@fortawesome/free-solid-svg-icons';
import { TranscriptSettings } from './TimedTextEditor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface TranscriptBlockProps {
    // Our Transcript
    speaker: string;
    time: {
        start: number;
        end: number;
    };
    caption: string;
    onWordClick: (word: string) => void;
    onSave: () => {};
    settings: TranscriptSettings;
}

const TranscriptContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

const TranscriptHeader = styled.div`
    display: flex;
    flex-direction: row;
`;

const TranscriptBody = styled.div`
    display: flex;
`;
/**
 * Here we will have the following compnents:  
 * SpeakerLabel 
 * Timecode Element
 * -> Editor Block
 */

// this component Should render an author name, timecode, and text.
export const TranscriptBlock: React.FC<TranscriptBlockProps> = (props: TranscriptBlockProps) => {
    // onWordClick ideally should update the time of the video to where the word is.
    const { settings, onWordClick, speaker, time, caption } = props; 

    const [speakerName, updateSpeakerName] = React.useState(speaker);

    const speakerPrompt = () => {
        const newName = prompt('Update Speaker Name?', speakerName);

        if (newName) {
            updateSpeakerName(newName);
        }
    };
    /**
     * So we have a time range and a speaker name, as well as text...
     * -> We just need to create displays for each of those.
     * -> on click for Speaker name should allow it to be edited.
     *    - create a "default" name.
     */
    return (
        <TranscriptContainer>
            <TranscriptHeader>
                <p>{time.start} to {time.end}</p>
                <div onClick={speakerPrompt}>
                    <FontAwesomeIcon icon={ faUserEdit } />
                    <p>{speakerName ?? 'TBD'}</p>
                </div>
            </TranscriptHeader>
            <TranscriptBody>
                {caption}
            </TranscriptBody>
        </TranscriptContainer>
    );
};