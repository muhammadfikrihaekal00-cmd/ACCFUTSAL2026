[System.Reflection.Assembly]::LoadWithPartialName("System.Drawing") | Out-Null

function Compress-Jpeg {
    param (
        [string]$Path,
        [int]$Quality = 72,
        [int]$MaxWidth = 640
    )

    if (-not (Test-Path $Path)) { return }

    $origBytes = (Get-Item $Path).Length
    $img = [System.Drawing.Image]::FromFile($Path)
    
    $w = $img.Width
    $h = $img.Height
    
    $targetW = [math]::Min($w, $MaxWidth)
    $targetH = [int]($h * ($targetW / $w))
    
    $bmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
    $graph = [System.Drawing.Graphics]::FromImage($bmp)
    $graph.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graph.DrawImage($img, 0, 0, $targetW, $targetH)
    $graph.Dispose()
    $img.Dispose()

    $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)

    $tempPath = $Path + ".tmp.jpg"
    $bmp.Save($tempPath, $encoder, $encoderParams)
    $bmp.Dispose()

    $newBytes = (Get-Item $tempPath).Length
    if ($newBytes -lt $origBytes) {
        Move-Item -Force $tempPath $Path
        Write-Output "Optimized $Path : $origBytes -> $newBytes bytes ($([math]::Round(($origBytes - $newBytes) / $origBytes * 100))% saved)"
    } else {
        Remove-Item $tempPath
        Write-Output "Kept $Path original: $origBytes bytes"
    }
}

function Compress-Png {
    param (
        [string]$Path,
        [int]$MaxWidth = 220
    )

    if (-not (Test-Path $Path)) { return }

    $origBytes = (Get-Item $Path).Length
    $img = [System.Drawing.Image]::FromFile($Path)
    
    $w = $img.Width
    $h = $img.Height
    
    $targetW = [math]::Min($w, $MaxWidth)
    $targetH = [int]($h * ($targetW / $w))
    
    $bmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
    $graph = [System.Drawing.Graphics]::FromImage($bmp)
    $graph.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graph.DrawImage($img, 0, 0, $targetW, $targetH)
    $graph.Dispose()
    $img.Dispose()

    $tempPath = $Path + ".tmp.png"
    $bmp.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    $newBytes = (Get-Item $tempPath).Length
    if ($newBytes -lt $origBytes) {
        Move-Item -Force $tempPath $Path
        Write-Output "Optimized $Path : $origBytes -> $newBytes bytes ($([math]::Round(($origBytes - $newBytes) / $origBytes * 100))% saved)"
    } else {
        Remove-Item $tempPath
        Write-Output "Kept $Path original: $origBytes bytes"
    }
}

Compress-Png -Path "assets/acc_logo.png" -MaxWidth 220
Compress-Jpeg -Path "assets/hero_banner.jpg" -Quality 72 -MaxWidth 640
Compress-Jpeg -Path "assets/moment_trophy.jpg" -Quality 70 -MaxWidth 480
Compress-Jpeg -Path "assets/moment_strike.jpg" -Quality 70 -MaxWidth 480
Compress-Jpeg -Path "assets/moment_celebration.jpg" -Quality 70 -MaxWidth 480
Compress-Jpeg -Path "assets/moment_gk_save.jpg" -Quality 70 -MaxWidth 480
Compress-Jpeg -Path "assets/mvp_player.jpg" -Quality 72 -MaxWidth 320
Compress-Jpeg -Path "assets/coach_bayu.jpg" -Quality 72 -MaxWidth 320
Compress-Jpeg -Path "assets/player_athar.jpg" -Quality 72 -MaxWidth 320
Compress-Jpeg -Path "assets/player_ghazi.jpg" -Quality 72 -MaxWidth 320
Compress-Jpeg -Path "assets/player_tariq.jpg" -Quality 72 -MaxWidth 320
