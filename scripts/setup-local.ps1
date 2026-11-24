$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskData = Join-Path $taskRoot '.local/mysql'
$taskBase = 'C:/laragon/bin/mysql/mysql-8.0.30-winx64'
$taskServer = Join-Path $taskBase 'bin/mysqld.exe'
$taskClient = Join-Path $taskBase 'bin/mysql.exe'
$taskPort = 3307
if (-not (Test-Path -LiteralPath $taskServer)) { throw 'Set taskBase in scripts/setup-local.ps1 to your MySQL installation.' }
New-Item -ItemType Directory -Force -Path (Join-Path $taskRoot '.local') | Out-Null
if (-not (Test-Path -LiteralPath (Join-Path $taskData 'mysql'))) {
  New-Item -ItemType Directory -Force -Path $taskData | Out-Null
  & $taskServer --no-defaults --initialize-insecure "--basedir=$taskBase" "--datadir=$taskData"
  if ($LASTEXITCODE -ne 0) { throw 'MySQL initialization failed.' }
}
$taskListening = Get-NetTCPConnection -State Listen -LocalPort $taskPort -ErrorAction SilentlyContinue
if (-not $taskListening) {
  Start-Process -FilePath $taskServer -WindowStyle Hidden -ArgumentList @('--no-defaults', "--basedir=$taskBase", "--datadir=$taskData", '--bind-address=127.0.0.1', "--port=$taskPort", '--mysqlx=OFF', '--max-connections=30', '--innodb-buffer-pool-size=128M', '--log-error=portfolio-mysql.log')
  for ($taskAttempt=0; $taskAttempt -lt 30; $taskAttempt++) {
    Start-Sleep -Milliseconds 500
    if (Get-NetTCPConnection -State Listen -LocalPort $taskPort -ErrorAction SilentlyContinue) { break }
  }
}
$taskEnvPath = Join-Path $taskRoot '.env'
if (-not (Test-Path -LiteralPath $taskEnvPath)) {
  $taskDbPassword = & node -e "process.stdout.write(require('crypto').randomBytes(24).toString('hex'))"
  $taskRootPassword = & node -e "process.stdout.write(require('crypto').randomBytes(24).toString('hex'))"
  $taskAuthSecret = & node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"
  $taskWorkerSecret = & node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"
  $taskAdminPassword = 'Frame-' + (& node -e "process.stdout.write(require('crypto').randomBytes(12).toString('hex'))")
  $taskSql = "CREATE DATABASE IF NOT EXISTS portfolio_media CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER IF NOT EXISTS 'portfolio_media'@'127.0.0.1' IDENTIFIED BY '$taskDbPassword'; GRANT ALL PRIVILEGES ON portfolio_media.* TO 'portfolio_media'@'127.0.0.1'; ALTER USER 'root'@'localhost' IDENTIFIED BY '$taskRootPassword';"
  $taskSql | & $taskClient --host=127.0.0.1 "--port=$taskPort" --user=root
  if ($LASTEXITCODE -ne 0) { throw 'Could not create the project database account.' }
  [System.IO.File]::WriteAllText((Join-Path $taskRoot '.local/mysql-root.txt'), $taskRootPassword)
  $taskFfmpeg = (Get-Command ffmpeg -ErrorAction Stop).Source.Replace('\','/')
  $taskFfprobe = (Get-Command ffprobe -ErrorAction Stop).Source.Replace('\','/')
  $taskEnv = @"
DATABASE_URL="mysql://portfolio_media:$taskDbPassword@127.0.0.1:$taskPort/portfolio_media?connection_limit=5"
APP_URL="http://127.0.0.1:3000"
AUTH_SECRET="$taskAuthSecret"
WORKER_SECRET="$taskWorkerSecret"
ADMIN_EMAIL="admin@portfolio.local"
ADMIN_PASSWORD="$taskAdminPassword"
STORAGE_DRIVER="local"
LOCAL_STORAGE_DIR=".local/storage"
FFMPEG_PATH="$taskFfmpeg"
FFPROBE_PATH="$taskFfprobe"
MAX_IMAGE_BYTES="52428800"
MAX_VIDEO_BYTES="2147483648"
MAX_STORAGE_BYTES="21474836480"
"@
  [System.IO.File]::WriteAllText($taskEnvPath, $taskEnv)
}
Write-Output 'Project MySQL is running on 127.0.0.1:3307. Local credentials are stored in the ignored .env file.'
