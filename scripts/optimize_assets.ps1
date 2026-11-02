[System.Reflection.Assembly]::LoadWithPartialName("System.Drawing") | Out-Null

function Compress-Jpeg {
    param (
        [string]$Path,
        [int]$Quality = 82,
        [int]$MaxWidth = 1000
    )

    if (-not (Test-Path $Path)) { return }

    $origBytes = (Get-Item $Path).Length
    $img = [System.Drawing.Image]::FromFile($Path)
    
    $w = $img.Width
    $h = $img.Height
    
    if ($w -gt $MaxWidth) {
        $newW = $MaxWidth
        $newH = [int]($h * ($MaxWidth / $w))
        $bmp = New-Object System.Drawing.Bitmap($newW, $newH)
        $graph = [System.Drawing.Graphics]::FromImage($bmp)
        $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graph.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graph.DrawImage($img, 0, 0, $newW, $newH)
        $graph.Dispose()
        $img.Dispose()
        $img = $bmp
    }

    $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)

    $tempPath = $Path + ".tmp.jpg"
    $img.Save($tempPath, $encoder, $encoderParams)
    $img.Dispose()

    $newBytes = (Get-Item $tempPath).Length
    if ($newBytes -lt $origBytes) {
        Move-Item -Force $tempPath $Path
        Write-Output "Optimized $Path : $origBytes -> $newBytes bytes ($([math]::Round(($origBytes - $newBytes) / $origBytes * 100))% saved)"
    } else {
        Remove-Item $tempPath
        Write-Output "Kept $Path original: $origBytes bytes"
    }
}

Compress-Jpeg -Path "assets/hero_banner.jpg" -Quality 80 -MaxWidth 1100
Compress-Jpeg -Path "assets/moment_trophy.jpg" -Quality 78 -MaxWidth 600
Compress-Jpeg -Path "assets/moment_strike.jpg" -Quality 78 -MaxWidth 600
Compress-Jpeg -Path "assets/moment_celebration.jpg" -Quality 78 -MaxWidth 600
Compress-Jpeg -Path "assets/moment_gk_save.jpg" -Quality 78 -MaxWidth 600
Compress-Jpeg -Path "assets/mvp_player.jpg" -Quality 80 -MaxWidth 450
Compress-Jpeg -Path "assets/coach_bayu.jpg" -Quality 80 -MaxWidth 400
Compress-Jpeg -Path "assets/player_athar.jpg" -Quality 80 -MaxWidth 400
Compress-Jpeg -Path "assets/player_ghazi.jpg" -Quality 80 -MaxWidth 400
Compress-Jpeg -Path "assets/player_tariq.jpg" -Quality 80 -MaxWidth 400
