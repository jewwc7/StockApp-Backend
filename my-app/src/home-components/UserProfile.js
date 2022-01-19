import React from "react";
import AvatarComponent from "./AvatarComponent";
import { Grid } from "@material-ui/core";
import AccountCircleIcon from "@material-ui/icons/AccountCircle";

export const UserProfile = ({ currentUserObject }) => {
  return (
    <Grid container>
      <Grid container item spacing={2} direction="column" style={userBodyStyle}>
        <Grid item>
          <AccountCircleIcon style={{ fontSize: "80px" }} />
        </Grid>
        {/* <Grid item><img style={userPicStyle} src={currentUserObject.pic} alt='ME'></img> </Grid> */}{" "}
        {/* if user has cstms display the legnth if not say no cstmns yet */}
        <Grid item container style={custAmntStyle}>
          {currentUserObject.myCustomers ? (
            <AvatarComponent currentUserObject={currentUserObject} />
          ) : (
            "No Customers Yet"
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

const userPicStyle = {
  position: "relative",
  width: "100%",
};
const userBodyStyle = {
  position: "relative",
  //  width: '100%',
  //  height: '100%',
  textAlign: "left",
  boxShadow: "5px 5px 32px 7px rgba(0,0,0,0.44)",
  width: "450px",
  background: "#050a30",
};

const custAmntStyle = {
  position: "relative",
  fontSize: "20px",
};

export default UserProfile;
