import React from "react";
import renderer from "react-test-renderer";
import Dashboard from "../../src/components/Dashboard";
import { BrowserRouter as Router } from 'react-router-dom';

describe("<Dashboard />", () => {
  it("Renders correctly", () => {
    const tree = renderer.create(<Router><Dashboard /></Router>).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
