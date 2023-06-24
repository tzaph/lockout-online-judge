import React from "react";
import renderer from "react-test-renderer";
import RefreshProblemDatabase from "../../src/components/RefreshProblemDatabase";
import { BrowserRouter as Router } from 'react-router-dom';

describe("<RefreshProblemDatabase />", () => {
  it("Renders correctly", () => {
    const tree = renderer.create(<Router><RefreshProblemDatabase /></Router>).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
