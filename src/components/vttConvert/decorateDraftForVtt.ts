/**
 * This is a collection of the Javascript code from bbc/react-transcript-editor
 * that allows us to export DraftJS back to VTT.
 */

// code obtained from https://github.com/bbc/stt-align-node

import difflib from 'difflib';
import { EditorState, RawDraftContentBlock, RawDraftContentState, convertFromRaw, convertToRaw } from 'draft-js';
import everpolate from 'everpolate';
import { toWords } from 'number-to-words';

/**
 * https://stackoverflow.com/questions/175739/built-in-way-in-javascript-to-check-if-a-string-is-a-valid-number
 * @param {*}  num
 * @return {boolean} - if it's a number true, if it's not false.
 */
function isANumber(num) {
    return !isNaN(num);
}

function removeTrailingPunctuation(str) {
    return str.replace(/\.$/, '');
}

/**
 * removes capitalization, punctuation and converts numbers to letters
 * @param {string} wordText - word text
 * @return {string}
 * handles edge case if word is undefined, and returns undefined in that instance
 */
function normaliseWord(wordText) {
    if (wordText) {
        const wordTextResult = wordText
            .toLowerCase()
            .trim()
            .replace(/[^a-z|0-9|.]+/g, '');
        if (isANumber(wordTextResult)) {
            const sanitizedWord = removeTrailingPunctuation(wordTextResult);
            if (sanitizedWord !== '') {
                return toWords(sanitizedWord);
            }
        }

        return wordTextResult;
    } else {
        return wordText;
    }
}

// using neighboring words to set missing start and end time when present
function interpolationOptimization(wordsList) {
    return wordsList.map((word, index) => {
        let wordTmp = word;
        // setting the start time of each unmatched word to the previous word’s end time - when present
        // does not first element in list edge case

        if ('start' in word && index !== 0) {
            const previousWord = wordsList[index - 1];
            if ('end' in previousWord) {
                wordTmp = {
                    start: previousWord.end,
                    end: word.end,
                    word: word.word
                };
            }
        }
        // TODO: handle first item ?
        // setting the end time of each unmatched word to the next word’s start time - when present
        // does handle last element in list edge case
        if ('end' in word && index !== wordsList.length - 1) {
            const nextWord = wordsList[index + 1];
            if ('start' in nextWord) {
                wordTmp = {
                    end: nextWord.start,
                    start: word.start,
                    word: word.word
                };
            }
        }

        // TODO: handle last item ?
        return wordTmp;
    });
}

// after the interpolation, some words have overlapping timecodes.
// the end time of the previous word is greater then the start of the current word
// altho negligible when using in a transcript editor context
// we want to avoid this, coz it causes issues when using the time of the words to generate
// auto segmented captions. As it results in sentence
// boundaries overlapping on screen during playback
function adjustTimecodesBoundaries(words) {
    return words.map((word, index, arr) => {
        // excluding first element
        if (index != 0) {
            const previousWord = arr[index - 1];
            const currentWord = word;
            if (previousWord.end > currentWord.start) {
                word.start = previousWord.end;
            }

            return word;
        }

        return word;
    });
}

function interpolate(wordsList) {
    const words = interpolationOptimization(wordsList);
    const indicies = [...Array(words.length).keys()];
    const indiciesWithStart: any[] = [];
    const indiciesWithEnd: any[] = [];
    const startTimes: any[] = [];
    const endTimes: any[] = [];

    words.forEach((word, index) => {
        if ('start' in word) {
            indiciesWithStart.push(index);
            startTimes.push(word.start);
        }

        if ('end' in word) {
            indiciesWithEnd.push(index);
            endTimes.push(word.end);
        }
    });
    // http://borischumichev.github.io/everpolate/#linear
    const outStartTimes = everpolate.linear(indicies, indiciesWithStart, startTimes);
    const outEndTimes = everpolate.linear(indicies, indiciesWithEnd, endTimes);
    const wordsResults = words.map((word, index) => {
        if (!('start' in word)) {
            word.start = outStartTimes[index];
        }
        if (!('end' in word)) {
            word.end = outEndTimes[index];
        }

        return word;
    });

    return adjustTimecodesBoundaries(wordsResults);
}

/**
 *
 * @param {array} sttWords - array of STT words
 * @param {array} transcriptWords - array of base text accurate words
 */
function alignWords(sttWords, transcriptWords) {
    // # convert words to lowercase and remove numbers and special characters
    const sttWordsStripped = sttWords.map(word => {
        return normaliseWord(word.word);
    });

    const transcriptWordsStripped = transcriptWords.map(word => {
        return normaliseWord(word);
    });
    // # create empty list to receive data
    const transcriptData: any[] = [];
    // empty objects as place holder
    transcriptWords.forEach(() => {
        transcriptData.push({});
    });
    // # populate transcriptData with matching words
    // // if they are same length, just interpolate words ?
    // http://qiao.github.io/difflib.js/
    const matcher = new difflib.SequenceMatcher(null, sttWordsStripped, transcriptWordsStripped);
    const opCodes = matcher.getOpcodes();

    opCodes.forEach(opCode => {
        const matchType = opCode[0];
        const sttStartIndex = opCode[1];
        const sttEndIndex = opCode[2];
        const baseTextStartIndex = opCode[3];

        if (matchType === 'equal') {
            // slice does not not include the end - hence +1
            const sttDataSegment = sttWords.slice(sttStartIndex, sttEndIndex);
            transcriptData.splice(baseTextStartIndex, sttDataSegment.length, ...sttDataSegment);
        }

        transcriptData.forEach((wordObject, index) => {
            wordObject.word = transcriptWords[index];
        });
        // # replace words with originals
    });

    // # fill in missing timestamps
    return interpolate(transcriptData);
}

export interface EntityMap {
    [K: string]: {
        type: 'WORD';
        mutability: 'MUTABLE';
        data: EntityRange;
    };
}

const flatten = list => list.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);

const createEntityMap = (blocks): EntityMap => {
    const entityRanges = blocks.map(block => block.entityRanges);
    // eslint-disable-next-line no-use-before-define
    const flatEntityRanges = flatten(entityRanges);

    const entityMap: EntityMap = {};

    flatEntityRanges.forEach(data => {
        entityMap[data.key] = {
            type: 'WORD',
            mutability: 'MUTABLE',
            data
        };
    });
    return entityMap;
};

export interface EntityRange {
    confidence: number;
    start: number;
    end: number;
    text: number;
    offset: number;
    punct: string;
    length: number;
    key: number;
}

// Not sure how this lines up with teh above.. but the above dont work for
// what is needed in here.
export interface Entity {
    confidence: number;
    start: number;
    end: number;
    word: string;
    punct: string;
    index: number;
}

// Given a "Start" and "End" time, we rougly calculate the time per word.
const generateEntitiesRanges = (words, start, end): EntityRange[] => {
    let position = 0;
    let timePosition = start;
    const timePerWord = (end - start) / words.length;

    return words.map(word => {
        const result = {
            confidence: 0,
            start: timePosition,
            end: timePosition + timePerWord,
            text: word,
            offset: position,
            length: word.length,
            key: Math.random()
                .toString(36)
                .substring(6)
        };
        // increase position counter - to determine word offset in paragraph
        position = position + word.length + 1;
        timePosition = timePosition + timePerWord;
        return result;
    });
};

/**
 * Helper function to generate draft.js entities,
 * see unit test for example data structure
 * it adds offset and length to recognise word in draftjs
 *
 *  @param {json} words  - List of words
 *  @param {string} wordAttributeName - eg 'punct' or 'text' or etc.
 * attribute for the word object containing the text. eg word ={ punct:'helo', ... }
 *  or eg word ={ text:'helo', ... }
 */
const generateEntitiesRangesAdept = (words, wordAttributeName) => {
    let position = 0;

    return words.map(word => {
        const result = {
            start: word.start,
            end: word.end,
            confidence: word.confidence,
            text: word[wordAttributeName],
            offset: position,
            length: word[wordAttributeName].length,
            key: Math.random()
                .toString(36)
                .substring(6)
        };
        // increase position counter - to determine word offset in paragraph
        position = position + word[wordAttributeName].length + 1;

        return result;
    });
};

/**
 * This defines the data associated with our independent Transcript blocks
 */
export interface TranscriptBlock {
    text: string;
    type: 'paragraph';

    data: {
        speaker: string;
        start: number;
        words: string[];
    };
    entityRanges: EntityRange[];
}

export interface TranscriptDraft {
    blocks: TranscriptBlock[];
    entityMap: EntityMap;
}

export const convertVttToDraftJs = (vttText: string): TranscriptDraft => {
    const blocks = [] as any[];
    // 1
    // 00:00:13.020 --> 00:00:13.860
    // There is a day.
    //
    // 2
    // 00:00:13.860 --> 00:00:16.280
    // About one million years ago when I asked a

    //normalize input
    vttText = vttText.replace(/\r\n/gi, '\n');
    vttText = vttText.replace(/\r/gi, '\n');
    const vttParagraphs = vttText.split('\n\n');

    //remove webvtt entry
    vttParagraphs.shift();
    if (vttParagraphs[vttParagraphs.length - 1] === '') vttParagraphs.pop();
    vttParagraphs.forEach((paragraph: string) => {
        const lines = paragraph.split('\n');

        //get indicie and time range form the vtt paragraph

        const timeRange = lines.splice(0, 2)[1];
        const [startString, endString] = timeRange.split(' --> ');

        const [noMetaStartTime] = startString.split(' '); // split it at the colons
        const [noMetaEndTime] = endString.split(' '); // split it at the colons
        const splitStartTime = noMetaStartTime.split(':'); // split it at the colons
        const splitEndTime = noMetaEndTime.split(':'); // split it at the colons
        // minutes are worth 60 seconds. Hours are worth 60 minutes.

        const startInSeconds =
            +Number(splitStartTime[0]) * 60 * 60 + +Number(splitStartTime[1]) * 60 + +Number(splitStartTime[2]);
        const endInSeconds =
            +Number(splitEndTime[0]) * 60 * 60 + +Number(splitEndTime[1]) * 60 + +Number(splitEndTime[2]);

        const text = lines.join(' ');
        const words = text.split(' ');

        const draftJsContentBlockParagraph = {
            text, //conjoin the rest of the lines, ignoring metadata
            type: 'paragraph',
            data: {
                speaker: 'TBC',
                start: startInSeconds,
                words
            },
            // the entities as ranges are each word in the space-joined text,
            // so it needs to be compute for each the offset from the beginning of the paragraph and the length
            entityRanges: generateEntitiesRanges(words, startInSeconds, endInSeconds)
        };

        blocks.push(draftJsContentBlockParagraph);
    });

    return { blocks, entityMap: createEntityMap(blocks) };
};

// Update timestamps usign stt-align (bbc).
export const updateTimestamps = (
    currentContent: RawDraftContentState,
    originalContent: RawDraftContentState
): RawDraftContentState => {
    const currentText = convertContentToText(currentContent);

    const entityMap = originalContent.entityMap;

    const entities: Array<{ start: number; end: number; word: string }> = [];

    for (const entityIdx in entityMap) {
        entities.push({
            start: parseFloat(entityMap[entityIdx].data.start),
            end: parseFloat(entityMap[entityIdx].data.end),
            word: entityMap[entityIdx].data.text
        });
    }

    const result = alignWords(entities, currentText);

    const newEntities: EntityRange[] = result.map((entry, index) => {
        return createEntity(entry.start, entry.end, 0.0, entry.word, index);
    });

    const updatedContent = createContentFromEntityList(currentContent, newEntities);

    return updatedContent;
};

const convertContentToText = (content: RawDraftContentState) => {
    let text: any[] = [];

    for (const blockIndex in content.blocks) {
        const block = content.blocks[blockIndex];
        const blockArray = block.text.match(/\S+/g) || [];
        text = text.concat(blockArray);
    }

    return text;
};

export const updateTimestampsForEditorState = (editorState: EditorState, originalState: RawDraftContentState) => {
    // Update timestamps according to the original state.
    const currentContent = convertToRaw(editorState.getCurrentContent());
    const updatedContentRaw = updateTimestamps(currentContent, originalState);
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

        return newEditorStateSelected;
    } else {
        //this.setState({ editorState: newEditorState });
        return newEditorState;
    }
};

const createEntity = (start, end, confidence, word, wordIndex): Entity => {
    return {
        start: start,
        end: end,
        confidence: confidence,
        word: word.toLowerCase().replace(/[.?!]/g, ''),
        punct: word,
        index: wordIndex
    };
};

const createContentFromEntityList = (
    currentContent: RawDraftContentState,
    newEntities: EntityRange[]
): RawDraftContentState => {
    // Update entites to block structure.
    const updatedBlockArray: RawDraftContentBlock[] = [];
    let totalWords = 0;

    for (const blockIndex in currentContent.blocks) {
        const block = currentContent.blocks[blockIndex];
        // if copy and pasting large chunk of text
        // currentContentBlock, would not have speaker and start/end time info
        // so for updatedBlock, getting start time from first word in blockEntities
        const wordsInBlock = (block.text.match(/\S+/g) || []).length;
        const blockEntites = newEntities.slice(totalWords, totalWords + wordsInBlock);
        let speaker = block?.data?.speaker;

        if (!speaker) {
            speaker = 'U_UKN';
        }

        const updatedBlock = ({
            text: blockEntites.map(entry => entry.punct).join(' '),
            type: 'paragraph',
            data: {
                speaker: speaker,
                words: blockEntites,
                start: blockEntites[0].start,
                end: blockEntites[0].end
            },
            entityRanges: generateEntitiesRangesAdept(blockEntites, 'punct')
        } as unknown) as RawDraftContentBlock;

        updatedBlockArray.push(updatedBlock);
        totalWords += wordsInBlock;
    }

    return { blocks: updatedBlockArray, entityMap: createEntityMap(updatedBlockArray) };
};
