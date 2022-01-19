import './App.css';
import React, {Fragment, useState, useEffect,useReducer} from 'react';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import NavBar from './NavBar';
import Register from './Register';
import Signin from './Signin';
import HomeBody from './home-components/HomeBody'


function App() {
  return (
    <div style={entireBodyStyle}>
          <NavBar />
      <Switch>
        <Route exact path= '/' component={HomeBody}></Route>
        <Route path = '/register' component={Register}></Route>
        <Route path = '/signin' component={Signin}></Route>
      </Switch>
    </div>
  );
}

const entireBodyStyle ={
//  background: '#9370DB',
  height: '1000px',
  background:'black',

}
export default App;
