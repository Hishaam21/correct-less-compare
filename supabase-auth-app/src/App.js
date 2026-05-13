import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import Premium from './pages/Premium';
import Login from './components/Login';
import Signup from './components/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import LogoutButton from './components/LogoutButton';

const App = () => {
  return (
    <Router>
      <div>
        <LogoutButton />
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <ProtectedRoute path="/premium" component={Premium} />
        </Switch>
      </div>
    </Router>
  );
};

export default App;