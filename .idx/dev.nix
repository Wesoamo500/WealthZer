{ pkgs, ... }: {
  channel = "stable-24.05";
  packages = [
    pkgs.jdk21          # Updated for Capacitor 7
    pkgs.nodejs_22
    pkgs.android-tools
  ];
  idx.previews = {
    enable = true;
    previews = {
      android = {
        # This command builds the app and launches it on the emulator automatically
        command = [ "npx" "ionic" "capacitor" "run" "android" "--nohooks" "--no-native-run" "--target" "emulator-5554" ];
        manager = "android";
      };
    };
  };
}
