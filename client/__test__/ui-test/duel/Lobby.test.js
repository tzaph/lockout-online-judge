import React from "react";
import renderer from "react-test-renderer";
import Lobby from "../../../src/components/duel/Lobby";
import { BrowserRouter as Router } from "react-router-dom";

describe("<Lobby />", () => {
  it("Renders correctly", () => {
    const tree = renderer
      .create(
        <Router>
          <Lobby />
        </Router>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
