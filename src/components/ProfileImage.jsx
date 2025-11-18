import React from "react";
import profilePic from "../assets/profile.png";

const ProfileImage = () => {
  return (
    <img
      src={profilePic}
      alt="Profile"
      style={{
        width: "220px",
        height: "220px",
        borderRadius: "50%",
        objectFit: "cover",
      }}
    />
  );
};

export default ProfileImage;


