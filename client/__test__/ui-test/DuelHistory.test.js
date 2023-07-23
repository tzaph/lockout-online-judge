import React from "react";
import renderer from "react-test-renderer";
import DuelHistory from "../../src/components/DuelHistory";
import { BrowserRouter as Router } from "react-router-dom";

describe("<DuelHistory />", () => {
  it("Renders correctly", () => {
    const tree = renderer
      .create(
        <Router>
          <DuelHistory />
        </Router>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
