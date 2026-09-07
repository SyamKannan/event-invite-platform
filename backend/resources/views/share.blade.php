<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <meta name="description" content="{{ $description }}">

    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ $shareUrl }}">
    <meta property="og:title" content="{{ $title }}">
    <meta property="og:description" content="{{ $description }}">
    @if ($image)
        <meta property="og:image" content="{{ $image }}">
    @endif

    <meta name="twitter:card" content="{{ $image ? 'summary_large_image' : 'summary' }}">
    <meta name="twitter:title" content="{{ $title }}">
    <meta name="twitter:description" content="{{ $description }}">
    @if ($image)
        <meta name="twitter:image" content="{{ $image }}">
    @endif

    {{-- Crawlers stop at the meta tags above; real browsers continue on to the SPA. --}}
    <meta http-equiv="refresh" content="0; url={{ $redirectUrl }}">
    <script>window.location.replace(@json($redirectUrl));</script>
</head>
<body>
    <p>Redirecting to <a href="{{ $redirectUrl }}">{{ $redirectUrl }}</a>&hellip;</p>
</body>
</html>
