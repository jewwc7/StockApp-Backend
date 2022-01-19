import React from "react";
import { ButtonGroup, Grid } from "@material-ui/core";
import { Button, TextField, InputAdornment } from "@material-ui/core"; //importing elements, can use destructuring
import { Snackbar, Input } from "@material-ui/core"; //importing elements, can use destructuring
import { AppBar } from "@material-ui/core"; //app bar//needs tool bar import as well
import { Toolbar } from "@material-ui/core";
import { Typography } from "@material-ui/core";
//import Alert from "@material-ui/lab/Alert"; //React would not find
import PeopleAltIcon from "@material-ui/icons/PeopleAlt";
import SearchIcon from "@material-ui/icons/Search";
import HomeIcon from "@material-ui/icons/Home";
import axios from "axios";
import { BrowserRouter as Router, Switch, Link } from "react-router-dom";
import {
  makeStyles,
  ThemeProvider,
  createMuiTheme,
} from "@material-ui/core/styles";

export default function NavBar() {
  const classes = useStyles();

  return (
    <AppBar position="sticky" style={appBarStyle}>
      {" "}
      {/*App bar will be displyed everywhere because it is not within a <Route></Route>(below)*/}
      <Toolbar
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Grid container direction="column" wrap="nowrap" xs={12} lg={4}>
          <Grid item>
            <h2> Gains & Losses</h2>
          </Grid>
          <Grid item style={{ marginTop: "-40px", paddingLeft: "15px" }}>
            <h3>Keep track of your Returns</h3>
          </Grid>
        </Grid>
        <Grid container direction="row" wrap="nowrap" xs={6} lg={4}>
          <Grid item>
            <TextField
              style={{ maxWidth: "300px" }}
              variant="outlined"
              label="search"
              onChange={() => console.log("searchChange")}
              InputProps={{
                // this is how you add icon
                //can use start or end(determines position of icon)
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon
                      style={{ cursor: "pointer" }}
                      onClick={() => console.log("searchChange")}
                    />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item container justify="center" style={{ marginTop: "15px" }}>
            <Grid item>
              <Link to="/friends" className={classes.icon}>
                <PeopleAltIcon />
              </Link>
            </Grid>
            <Grid item>
              <Link to="/" className={classes.icon}>
                <HomeIcon />
              </Link>
            </Grid>
          </Grid>
        </Grid>
        <Grid justify="flex-end" container xs={6} lg={4}>
          <Grid item>
            <ButtonGroup style={{ display: "flex", marginLeft: "" }}>
              <Link to="/signin">
                <Button className={classes.button} variant="contained">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outlined">Create Account</Button>
              </Link>
            </ButtonGroup>
          </Grid>
        </Grid>
      </Toolbar>
    </AppBar>
  );
}

const appBarStyle = {
  marginBottom: "00px",
  position: "relative",
  maxWidth: "1000%",
  background: "#FF4500",
  maxHeight: "400px",
};

const useStyles = makeStyles({
  button: {
    background: "#0007FF",
  },
  icon: {
    color: "black",
  },
});
