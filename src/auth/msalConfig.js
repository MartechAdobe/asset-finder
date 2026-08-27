export const msalConfig = {
  auth: {
    clientId: "91302f4b-c95b-4559-b355-3bcff2753798",

    authority:
      "https://login.microsoftonline.com/fa7b1b5a-7b34-4387-94ae-d2c178decee1",

    redirectUri: "http://localhost:5173",

    postLogoutRedirectUri: "http://localhost:5173"
  },

  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false
  }
};


export const loginRequest = {
  scopes: [
    "User.Read",
    "Files.Read.All",
    "Sites.Read.All"
  ]
};