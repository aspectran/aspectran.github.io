<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="sitemap xhtml">
<xsl:output method="html" encoding="UTF-8" indent="yes"/>

<xsl:template match="/">
  <html lang="en">
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <title>XML Sitemap - <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" integrity="sha384-sRIk9pPtwkPjGvptsmvdfwPvP6vP2sFz5tA5P/V9W0z5p7W5pZp5wFh4k3u9zX8b" crossorigin="anonymous"/>
      <link rel="stylesheet" href="https://assets.aspectran.com/bootstrap@5.3.8/css/sitemap.css"/>
      <!--<link rel="stylesheet" href="http://localhost:8090/assets/bootstrap@5.3.8/css/sitemap.css"/>-->
      <style>
        body {
          background-color: #f8f9fa;
          color: #212529;
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        header h1 {
          color: #399aba;
          font-weight: 700;
        }
        .table thead th {
          background-color: #e9ecef;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #dee2e6;
        }
        .table td a {
          color: #399aba;
          word-break: break-all;
        }
        .table td a:hover {
          color: #2b7791;
          text-decoration: underline;
        }
        .badge-lang {
          background-color: #eef2f5;
          color: #495057;
          border: 1px solid #ced4da;
          font-weight: 500;
          font-size: 0.75rem;
          padding: 0.25rem 0.45rem;
          text-decoration: none;
        }
        .badge-lang:hover {
          background-color: #399aba;
          color: #ffffff;
          border-color: #399aba;
        }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
    </head>
    <body>
      <div class="container my-5">
        <header class="mb-4 pb-3 border-bottom">
          <p class="lead text-secondary mb-1">Aspectran Website &amp; Documentation</p>
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h1 class="display-6 mb-1">XML Sitemap</h1>
              <p class="text-muted mb-0">
                This sitemap is generated for search engines like Google and Bing. Below is a human-readable list of all indexed URLs.
              </p>
            </div>
            <div>
              <span class="badge bg-primary fs-6 px-3 py-2">
                Total URLs: <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/>
              </span>
            </div>
          </div>
        </header>

        <div class="card shadow-sm border-0">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover table-striped align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col" class="text-center" style="width: 60px;">#</th>
                    <th scope="col">URL</th>
                    <th scope="col" class="text-center" style="width: 130px;">Alternates</th>
                    <th scope="col" class="text-center" style="width: 120px;">Frequency</th>
                    <th scope="col" class="text-center" style="width: 90px;">Priority</th>
                    <th scope="col" class="text-end pe-4" style="width: 160px;">Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:apply-templates select="sitemap:urlset/sitemap:url"/>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>
</xsl:template>

<xsl:template match="sitemap:url">
  <tr>
    <td class="text-center text-muted small">
      <xsl:value-of select="position()"/>
    </td>
    <td>
      <a href="{sitemap:loc}" class="text-decoration-none fw-semibold">
        <xsl:value-of select="sitemap:loc"/>
      </a>
    </td>
    <td class="text-center">
      <xsl:for-each select="xhtml:link[@rel='alternate']">
        <a href="{@href}" class="badge badge-lang rounded-pill me-1" title="{@href}">
          <xsl:value-of select="@hreflang"/>
        </a>
      </xsl:for-each>
    </td>
    <td class="text-center">
      <xsl:if test="sitemap:changefreq">
        <span class="badge bg-secondary-subtle text-secondary-emphasis border">
          <xsl:value-of select="sitemap:changefreq"/>
        </span>
      </xsl:if>
    </td>
    <td class="text-center">
      <xsl:if test="sitemap:priority">
        <span class="badge bg-info-subtle text-info-emphasis border">
          <xsl:value-of select="sitemap:priority"/>
        </span>
      </xsl:if>
    </td>
    <td class="text-end pe-4 text-muted small">
      <xsl:choose>
        <xsl:when test="contains(sitemap:lastmod, 'T')">
          <span title="{sitemap:lastmod}">
            <xsl:value-of select="substring-before(sitemap:lastmod, 'T')"/>
            <xsl:text> </xsl:text>
            <span class="text-muted"><xsl:value-of select="substring(substring-after(sitemap:lastmod, 'T'), 1, 5)"/></span>
          </span>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="sitemap:lastmod"/>
        </xsl:otherwise>
      </xsl:choose>
    </td>
  </tr>
</xsl:template>

</xsl:stylesheet>
