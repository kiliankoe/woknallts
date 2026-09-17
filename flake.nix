{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { nixpkgs, ... }:
    let
      forAllSystems = nixpkgs.lib.genAttrs nixpkgs.lib.systems.flakeExposed;
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          # bun runs the dev server, the build and the archive script. jq is what
          # the update Action validates the downloaded GeoJSON with.
          default = pkgs.mkShell {
            packages = with pkgs; [
              bun
              jq
            ];
          };
        }
      );
    };
}
