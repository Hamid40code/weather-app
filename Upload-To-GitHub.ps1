[CmdletBinding()]
param(
    [string]$CommitMessage
)

$ErrorActionPreference = 'Stop'

function Invoke-Git {
    param([Parameter(Mandatory = $true)][string[]]$GitArgs)
    & git @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Git command failed: git $($GitArgs -join ' ')"
    }
}

function Get-GitOutput {
    param([Parameter(Mandatory = $true)][string[]]$GitArgs)
    $output = & git @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Git command failed: git $($GitArgs -join ' ')"
    }
    return @($output)
}

try {
    $ProjectRoot = $PSScriptRoot
    if (-not (Test-Path (Join-Path $ProjectRoot 'package.json')) -or
        -not (Test-Path (Join-Path $ProjectRoot 'src'))) {
        throw 'Run this script from the extracted Atmos project folder. package.json and src must be present.'
    }

    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw 'Git was not found. Install Git for Windows, reopen PowerShell, and run this script again.'
    }

    Push-Location $ProjectRoot
    try {
        Write-Host ''
        Write-Host '=== Atmos Weather App - GitHub Upload ===' -ForegroundColor Cyan
        Write-Host "Project: $ProjectRoot"
        Write-Host ''

        if (-not (Test-Path (Join-Path $ProjectRoot '.git'))) {
            Write-Host 'Initializing Git repository...'
            Invoke-Git -GitArgs @('init')
        }

        Invoke-Git -GitArgs @('branch', '-M', 'main')

        # Only query origin after confirming that the remote exists.
        # This prevents: error: No such remote 'origin'
        $RemoteNames = Get-GitOutput -GitArgs @('remote')
        $HasOrigin = $RemoteNames -contains 'origin'

        if ($HasOrigin) {
            $RemoteOutput = Get-GitOutput -GitArgs @('remote', 'get-url', 'origin')
            $RemoteUrl = ($RemoteOutput | Select-Object -First 1).Trim()
            if ([string]::IsNullOrWhiteSpace($RemoteUrl)) {
                throw "The existing 'origin' remote has no URL. Check it with: git remote -v"
            }

            Write-Host "Existing origin: $RemoteUrl" -ForegroundColor Yellow
            $UseExisting = Read-Host 'Use this GitHub remote? (Y/n)'
            if ($UseExisting -match '^(n|no)$') {
                $NewRemoteUrl = Read-Host 'Enter the new GitHub repository URL (HTTPS or SSH)'
                if ([string]::IsNullOrWhiteSpace($NewRemoteUrl)) {
                    throw 'A GitHub repository URL is required.'
                }
                Invoke-Git -GitArgs @('remote', 'set-url', 'origin', $NewRemoteUrl.Trim())
            }
        }
        else {
            $RemoteUrl = Read-Host 'Paste your GitHub repository URL (HTTPS or SSH)'
            if ([string]::IsNullOrWhiteSpace($RemoteUrl)) {
                throw 'A GitHub repository URL is required.'
            }
            Invoke-Git -GitArgs @('remote', 'add', 'origin', $RemoteUrl.Trim())
            Write-Host "Added origin: $($RemoteUrl.Trim())" -ForegroundColor Green
        }

        Write-Host ''
        Write-Host 'Files that Git will track (ignored files such as node_modules and dist are excluded):'
        Invoke-Git -GitArgs @('status', '--short')
        Invoke-Git -GitArgs @('add', '--all')

        & git diff --cached --quiet
        $DiffExitCode = $LASTEXITCODE
        if ($DiffExitCode -eq 0) {
            Write-Host 'There are no new changes to commit.' -ForegroundColor Yellow
        }
        elseif ($DiffExitCode -eq 1) {
            if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
                $CommitMessage = Read-Host 'Enter a commit message (leave blank for the default)'
            }
            if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
                $CommitMessage = 'Add Atmos weather app'
            }
            Invoke-Git -GitArgs @('commit', '-m', $CommitMessage)
        }
        else {
            throw 'Could not check staged changes.'
        }

        & git rev-parse --verify HEAD *> $null
        if ($LASTEXITCODE -ne 0) {
            throw 'This repository has no commit to push. Make sure the project files are present and try again.'
        }

        Write-Host ''
        Write-Host 'Pushing branch main to GitHub...' -ForegroundColor Cyan
        Invoke-Git -GitArgs @('push', '--set-upstream', 'origin', 'main')

        Write-Host ''
        Write-Host 'Upload completed successfully!' -ForegroundColor Green
        Write-Host 'Your Atmos project is now pushed to the GitHub main branch.'
    }
    finally {
        Pop-Location
    }
}
catch {
    Write-Host ''
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
