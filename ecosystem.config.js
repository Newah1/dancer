module.exports = {
    apps : [{
      name   : "dancer",
      script : "./server/server.mjs",
      instances : "max", // Automatically scale based on CPU cores
      exec_mode : "cluster", // Use cluster mode for better performance
      max_memory_restart: "1G", // Restart if memory exceeds 1GB
      env: {
        "NODE_ENV": "production",
        "PORT": 5500
      },
      env_development: {
        "NODE_ENV": "development",
        "PORT": process.env.PORT || 3000
      },
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      time: true, // Add timestamps to logs
      merge_logs: true, // Merge logs from all instances
      log_date_format: "YYYY-MM-DD HH:mm:ss Z" // Better timestamp format
    }]
  };