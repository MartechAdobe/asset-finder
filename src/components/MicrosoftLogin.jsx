import { useEffect, useState } from "react";

import {
  msalInstance
} from "../auth/msalInstance";

import {
  loginRequest
} from "../auth/msalConfig";


export default function MicrosoftLogin() {

  const [account, setAccount] =
    useState(null);

  const [loading, setLoading] =
    useState(false);


  useEffect(() => {

    const accounts =
      msalInstance.getAllAccounts();

    if (accounts.length > 0) {
      setAccount(accounts[0]);
    }

  }, []);


  async function handleLogin() {

    setLoading(true);

    try {

      const response =
        await msalInstance.loginPopup(
          loginRequest
        );

      setAccount(response.account);

    } catch (error) {

      console.error(
        "Microsoft login failed:",
        error
      );

      alert(
        error.message ||
        "Microsoft login failed"
      );

    } finally {

      setLoading(false);

    }
  }


  async function handleLogout() {

    try {

      await msalInstance.logoutPopup();

      setAccount(null);

    } catch (error) {

      console.error(
        "Logout failed:",
        error
      );

    }
  }


  if (!account) {

    return (
      <button
        type="button"
        onClick={handleLogin}
        disabled={loading}
        className="microsoft-login-button"
      >
        {loading
          ? "Signing in..."
          : "Sign in with Microsoft"}
      </button>
    );

  }


  return (

    <div className="microsoft-account">

      <span>
        {account.name ||
          account.username}
      </span>

      <button
        type="button"
        onClick={handleLogout}
      >
        Sign out
      </button>

    </div>

  );

}