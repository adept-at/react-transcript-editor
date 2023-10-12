import textSegmentation from './text-segmentation/index.js';
import addLineBreakBetweenSentences from './line-break-between-sentences/index.js';
import foldWords from './fold/index.js';
import divideIntoTwoLines from './divide-into-two-lines/index.js';

/**
 * Takes in array of word object,
 *  and returns string containing all the text
 * @param {array} words - Words
 */
function getTextFromWordsList(words) {
  // Apply Speakers if they are here?
  const sentence = words.map((word) => {return word.text;}).join(' ');
  const speakers = Array.from(new Set(words.map((word) => {return word.speaker;}).filter((speaker) => {return !!speaker && speaker !== 'TBC';})));

  return sentence;
  console.log("You are looking at...", speakers)
  const finalText =  speakers.length > 0 ? `<v ${speakers.join('/')}>${sentence}</v>` : sentence;
  console.log(finalText, sentence, speakers);
  return finalText;
}

/**
 *
 * @param {*} textInput - can be either plain text string or an array of word objects
 */
function preSegmentText(textInput, tmpNumberOfCharPerLine = 35) {
  let text = textInput;
  if (typeof textInput === 'object') {
    text = getTextFromWordsList(textInput);
  }
  const segmentedText = textSegmentation(text);
  // - 2.Line brek between stentences
  const textWithLineBreakBetweenSentences = addLineBreakBetweenSentences(segmentedText);

  // - 3.Fold char limit per line
  const foldedText = foldWords(textWithLineBreakBetweenSentences, tmpNumberOfCharPerLine);
  // - 4.Divide into two lines
  // console.log(foldedText)
  const textDividedIntoTwoLines = divideIntoTwoLines(foldedText);

  console.log('textDividedIntoTwoLines', textDividedIntoTwoLines);
  return textDividedIntoTwoLines;
}

export {
  preSegmentText,
  getTextFromWordsList
};

export default preSegmentText;