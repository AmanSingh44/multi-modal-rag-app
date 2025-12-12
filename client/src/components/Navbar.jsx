import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/"> AI Tools </Link>
        </div>
        <ul className="navbar-menu">
          <li className="navbar-item">
            <Link to="/" className="navbar-link">
              Chat
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/email-generator" className="navbar-link">
              Email Generator
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/caption-generator" className="navbar-link">
              Caption Generator
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/data-analysis" className="navbar-link">
              Data Analysis
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
