import React from "react";
import renderer from "react-test-renderer";
import RoomList from "../../src/components/RoomList";
import { BrowserRouter as Router } from 'react-router-dom';

describe("<RoomList />", () => {
  it("Renders correctly", () => {
    const tree = renderer.create(<Router><RoomList /></Router>).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
