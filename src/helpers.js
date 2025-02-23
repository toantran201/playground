import {
  ContentBlock,
  ContentState,
  convertFromRaw,
  EditorState,
  Entity,
  Modifier,
  SelectionState,
} from "draft-js";
import { markdownToDraft } from "markdown-draft-js";
import { keyBy } from "lodash";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

function countLeadingCharacterByRegex(str, regex) {
  const leadingSpaces = str?.match(regex);
  return leadingSpaces ? leadingSpaces[0].length : 0;
}

function countTrailingCharacterByRegex(str, regex) {
  const trailingSpaces = str?.match(regex);
  return trailingSpaces ? trailingSpaces[0].length : 0;
}

function createMultipleCharacter(count, character) {
  if (count < 0) {
    return character;
  }
  return character.repeat(count);
}

function transformMarkdownTextItem(markdownString) {
  const numberOfLeadingSpaces = countLeadingCharacterByRegex(
    markdownString,
    /^ +/
  );
  const numberOfTrailingSpaces = countTrailingCharacterByRegex(
    markdownString,
    / +$/
  );
  let numberOfTrailingNewLines = countLeadingCharacterByRegex(
    markdownString,
    /\n+$/
  );
  const isEmptyContent = !markdownString.trim();

  const rawData = markdownToDraft(markdownString, {
    preserveNewlines: true,
  });
  let formattedContentState = convertFromRaw(rawData);
  // Spaces
  if (!!numberOfLeadingSpaces) {
    const key = formattedContentState.getFirstBlock().getKey();
    formattedContentState = Modifier.insertText(
      formattedContentState,
      new SelectionState({
        anchorKey: key,
        anchorOffset: 0,
        focusKey: key,
        focusOffset: 0,
      }),
      createMultipleCharacter(numberOfLeadingSpaces, " ")
    );
  }

  if (!!numberOfTrailingSpaces && !isEmptyContent) {
    const key = formattedContentState.getLastBlock().getKey();
    formattedContentState = Modifier.insertText(
      formattedContentState,
      new SelectionState({
        anchorKey: key,
        anchorOffset: formattedContentState.getPlainText().length,
        focusKey: key,
        focusOffset: formattedContentState.getPlainText().length,
      }),
      createMultipleCharacter(numberOfTrailingSpaces, " ")
    );
  }

  // New lines
  const arrayBlocks = formattedContentState.getBlocksAsArray();
  const lastItem = arrayBlocks[arrayBlocks.length - 1];
  if (
    lastItem?.getType() === "unordered-list-item" ||
    lastItem?.getType() === "ordered-list-item"
  ) {
    // With type list, markdownToDraft already added 1 new line break character
    numberOfTrailingNewLines -= 1;
  }

  if (numberOfTrailingNewLines > 0) {
    let newContentBlocks = [];
    for (let i = 0; i < numberOfTrailingNewLines; i++) {
      newContentBlocks.push(
        new ContentBlock({
          key: Math.random().toString(),
          text: "",
          type: "unstyled",
        })
      );
    }
    formattedContentState = ContentState.createFromBlockArray(
      formattedContentState.getBlocksAsArray().concat(newContentBlocks)
    );
  }
  return formattedContentState;
}

export function getMarkdownEditorStateFromMergeFields(
  mergeFields,
  options,
  products,
  selectedProductId,
  isPlainInput,
  optionArgs
) {
  const { showRawMergeField = false } = optionArgs || {};
  if (!mergeFields || mergeFields.length === 0) {
    return EditorState.createEmpty();
  }
  const optionByIds = keyBy(options, "id");
  let contentState = ContentState.createFromText("");
  mergeFields.forEach((item) => {
    const sanitizeText = item.text;
    let formattedContentState;
    if (isPlainInput) {
      formattedContentState = ContentState.createFromText(sanitizeText);
    } else {
      formattedContentState = transformMarkdownTextItem(sanitizeText);
    }
    const selectionState = contentState.getSelectionAfter();
    contentState = Modifier.replaceWithFragment(
      contentState,
      selectionState.merge({
        anchorOffset: contentState.getBlockMap().last().getLength(),
        focusOffset: contentState.getBlockMap().last().getLength(),
      }),
      formattedContentState.getBlockMap()
    );
  });
  return EditorState.createWithContent(contentState);
}
