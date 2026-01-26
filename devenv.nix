{
  services.postgres = {
    enable = true;
    initialDatabases = [
      {
        name = "plate";
      }
    ];
    listen_addresses = "127.0.0.1";
    hbaConf = ''
      local all all trust
      host all all 127.0.0.1/32 trust
    '';
  };
}