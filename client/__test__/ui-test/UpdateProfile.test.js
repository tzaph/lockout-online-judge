import React from "react";
import renderer from "react-test-renderer";
import UpdateProfile from "../../src/components/UpdateProfile";
import { BrowserRouter as Router } from 'react-router-dom';

describe("<UpdateProfile />", () => {
  it("Renders correctly", () => {
    const tree = renderer.create(<Router><UpdateProfile /></Router>).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
