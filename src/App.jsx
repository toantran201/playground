import "./styles.css";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { Editor } from "react-draft-wysiwyg";
import React from "react";
import { getMarkdownEditorStateFromMergeFields } from "./helpers";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: getMarkdownEditorStateFromMergeFields([{ text: "- 1234" }]),
    };
  }

  onEditorStateChange = (editorState) => {
    this.setState({
      editorState,
    });
  };

  render() {
    const { editorState } = this.state;
    return (
      <Editor
        editorState={editorState}
        wrapperClassName="demo-wrapper"
        editorClassName="demo-editor"
        onEditorStateChange={this.onEditorStateChange}
      />
    );
  }
}
export default App;
