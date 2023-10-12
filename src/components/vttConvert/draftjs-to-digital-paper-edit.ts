import { RawDraftEntity, Entity, RawDraftContentState } from "draft-js";

/**
 * Convert DraftJS to Digital Paper Edit format
 * More details see
 * https://github.com/bbc/digital-paper-edit
 */
interface DigitalPaperEditWord {
  end: number;
  start: number;
  speaker: string;
  id: number;
}

// These are the same, just more broken down?
interface DigitalPaperEditParagraph {
  end: number;
  start: number;
  speaker: string;
  id: number;
}

//type, mutability, data
type TranscriptWord = RawDraftEntity<
{ index: number; start: number; end: number; speaker: string; text?: string; punct?: string; word?: string; }
>;


interface DigitalPaperEditOutput {
  words: DigitalPaperEditWord[];
  paragraphs: DigitalPaperEditParagraph[];
}

export const convertToDigitalPaperEdit = (blockData: RawDraftContentState): DigitalPaperEditOutput => {
  const result: DigitalPaperEditOutput = { words: [], paragraphs: [] };

  const { blocks, entityMap } = blockData;

  /**
   * Iterate over our DraftJS blocks, converting each Block ("Paragraph") into our <DigitalPaperEditOutput>
   */
  const returns = blocks.reduce((memo, currentBlock, index) => {
    if (!currentBlock.data || (currentBlock.data.words ?? []).length === 0) {
      console.warn('No actionable items in DraftJs block.');
      return memo;
    }

    const { start, end, speaker, words } = currentBlock.data;

    // Sum up the paragraph...
    memo.paragraphs.push({
      id: index,
      start,
      end: end,
      speaker
    });

    memo.words.push(...words.map((wordText, index) => {
     const wordDetailIndex = currentBlock.entityRanges[index].key;
     // Struggling with some JS -> TS conversion here.
     const { data: word } = entityMap[wordDetailIndex] as TranscriptWord;

     console.log("Where does this come from?", word);
     return {
      id: word.index,
      start: word.start,
      end: word.end,
      speaker,
      // Other formats may forward as any of these attributes..
      // Simply pass it along if it exists anywhere, otherwise ignore.
      text: word.text ?? word.punct ?? word.word ?? undefined
     };
    }));

    return memo;
  }, result);

  return returns;
};
