import React, { Dispatch, SetStateAction, useEffect } from 'react';

import { mdiAccountEdit } from '@mdi/js';
import Icon from '@mdi/react';
import { EditorBlock, Modifier, EditorState, SelectionState, ContentBlock, ContentState } from 'draft-js';
import styled from 'styled-components';

import { TranscriptSettings } from './TimedTextEditor';

interface BlockProps {
    // Our Transcript
    editorState: EditorState;
    onWordClick: (word: string) => void;
    updateEditorState: Dispatch<SetStateAction<EditorState>>;
    settings: TranscriptSettings;
}

interface TranscriptBlockInput {
    block: ContentBlock;
    blockProps: BlockProps;
    contentState: ContentState;
}

const TranscriptContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
`;

const TranscriptHeader = styled.div`
    display: flex;
    flex-direction: row;
    padding: 0.5rem;
    justify-content: flex-start;
    align-items: center;
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
export const TranscriptBlock: React.FC<TranscriptBlockInput> = (props: TranscriptBlockInput) => {
    // onWordClick ideally should update the time of the video to where the word is.
    const { block, blockProps } = props;

    const [speakerName, updateSpeakerName] = React.useState(block.getData().get('speaker'));
    const [startTime] = React.useState(block.getData().get('start'));

    const { editorState } = blockProps;
    // So for speaker name changes we just update the blocks data?
    useEffect(() => {
        // Update the DraftJS block.
        const selection = SelectionState.createEmpty(block.getKey());

        const newContent = Modifier.mergeBlockData(
            editorState.getCurrentContent(),
            selection,
            block.getData().merge({ speaker: speakerName })
        );

        const newEditor = EditorState.push(blockProps.editorState, newContent, 'change-block-data');

        blockProps.updateEditorState(newEditor);
        // What would it be like to "update all" speaker names?
    }, [speakerName, blockProps.updateEditorState]);

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
                {startTime}
                <button onClick={speakerPrompt}>
                    <Icon path={mdiAccountEdit} size={'2em'} />
                </button>
                {speakerName ?? 'TBD'}
            </TranscriptHeader>
            <TranscriptBody>
                <EditorBlock {...props} />
            </TranscriptBody>
        </TranscriptContainer>
    );
};
