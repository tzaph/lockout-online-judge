import React from "react";
import renderer from "react-test-renderer";
import ProblemRecommendation from "../../src/components/ProblemRecommendation";
import { BrowserRouter as Router } from "react-router-dom";

describe("<ProblemRecommendation />", () => {
  it("Renders correctly", () => {
    const tree = renderer
      .create(
        <Router>
          <ProblemRecommendation />
        </Router>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
