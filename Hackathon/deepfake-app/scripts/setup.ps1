<#
Simple setup helper for Windows / PowerShell.
Run this from the `deepfake-app` folder to recreate environments after cleaning out build/env artifacts:

    cd deepfake-app
    .\scripts\setup.ps1

This will:
- create and install the backend venv
- install frontend dependencies (npm)

Note: the script shows commands and then prompts before executing to avoid unexpected changes.
#>
Write-Host "*** Deepfake-app setup helper ***"

function Prompt-YesNo($msg){
    $r = Read-Host "$msg [y/N]"
    return $r -match '^(y|Y)'
}

if (Prompt-YesNo "1) Create backend venv and install Python deps?"){
    Write-Host "Creating backend venv and installing requirements..."
    Push-Location backend
    if (-Not (Test-Path -Path '.venv')){
        python -m venv .venv
    }
    $activate = Join-Path -Path (Get-Location) -ChildPath '.venv\Scripts\Activate.ps1'
    if (Test-Path $activate){
        Write-Host "Activating venv and installing packages"
        & $activate
        pip install --upgrade pip
        pip install -r requirements.txt
    } else {
        Write-Host "Couldn't find Activate.ps1, please activate .venv manually and run: pip install -r requirements.txt"
    }
    Pop-Location
}

if (Prompt-YesNo "2) Install frontend npm dependencies?"){
    Write-Host "Installing frontend dependencies (npm install)..."
    Push-Location frontend
    if (Test-Path package-lock.json){
        npm ci
    } else {
        npm install
    }
    Pop-Location
}

Write-Host "Setup helper finished. See README for run instructions."
