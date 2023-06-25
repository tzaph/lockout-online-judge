import React from "react";
import renderer from "react-test-renderer";
import NavBar from "../../src/components/NavBar";
import { BrowserRouter as Router } from 'react-router-dom';

describe("<NavBar />", () => {
  it("Renders correctly", () => {
    const tree = renderer.create(<Router><NavBar /></Router>).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
