import React from "react";
import renderer from "react-test-renderer";
import PrivateRoute from "../../src/components/PrivateRoute";
import { BrowserRouter as Router } from 'react-router-dom';

describe("<PrivateRoute />", () => {
  it("Renders correctly", () => {
    const tree = renderer.create(<Router><PrivateRoute /></Router>).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
