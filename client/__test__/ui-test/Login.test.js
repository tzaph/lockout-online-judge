import React from "react";
import renderer from "react-test-renderer";
import Login from "../../src/components/Login";
import { BrowserRouter as Router } from "react-router-dom";

describe("<Login />", () => {
  it("Renders correctly", () => {
    const tree = renderer
      .create(
        <Router>
          <Login />
        </Router>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
