Add-Type -AssemblyName System.Drawing

function Optimize-Logo {
    param (
        [string]$FilePath,
        [int]$MaxWidth = 120,
        [int]$Quality = 75
    )

    if (-not (Test-Path $FilePath)) { return }

    $origBytes = (Get-Item $FilePath).Length
    $img = [System.Drawing.Image]::FromFile($FilePath)
    $w = $img.Width
    $h = $img.Height
    
    if ($w -le $MaxWidth -and $origBytes -lt 5000) {
        $img.Dispose()
        return
    }

    $targetW = [math]::Min($w, $MaxWidth)
    $targetH = [int]($h * ($targetW / $w))
    if ($targetH -lt 1) { $targetH = 1 }

    $bmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($img, 0, 0, $targetW, $targetH)
    $g.Dispose()
    $img.Dispose()

    $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $p = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)

    $tmp = $FilePath + '.tmp.jpg'
    $bmp.Save($tmp, $enc, $p)
    $bmp.Dispose()

    $newBytes = (Get-Item $tmp).Length
    if ($newBytes -lt $origBytes) {
        Move-Item -Force $tmp $FilePath
        Write-Output "$FilePath : $origBytes -> $newBytes bytes ($([math]::Round(($origBytes - $newBytes) / $origBytes * 100))% saved)"
    } else {
        Remove-Item $tmp
    }
}

Get-ChildItem -Path "assets/teams" -Filter "logo.jpg" -Recurse | ForEach-Object {
    Optimize-Logo -FilePath $_.FullName -MaxWidth 120 -Quality 75
}

Optimize-Logo -FilePath "assets/habiburrahman_logo.jpg" -MaxWidth 120 -Quality 75
Optimize-Logo -FilePath "assets/pesantren_haniah_logo.jpg" -MaxWidth 120 -Quality 75
Optimize-Logo -FilePath "assets/sdn_57_bulubulu_logo.jpg" -MaxWidth 120 -Quality 75
