import React from "react";
import renderer from "react-test-renderer";
import Register from "../../src/components/Register";
import { BrowserRouter as Router } from "react-router-dom";

describe("<Register />", () => {
  it("Renders correctly", () => {
    const tree = renderer
      .create(
        <Router>
          <Register />
        </Router>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
