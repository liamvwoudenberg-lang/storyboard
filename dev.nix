{ pkgs }:
{
  deps = [
    pkgs.nodejs_20
    pkgs.nodePackages.pnpm
    pkgs.google-cloud-sdk
    pkgs.gnumake
    pkgs.chromium
    pkgs.lighthouse
  ];
  #You can also add environment variables here
  /*
  env = {
    GOPATH= "/home/runner/${REPL_SLUG}/go";
  };
  */
}