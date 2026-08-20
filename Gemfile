# Gemfile for GitHub Pages
#
# 本仓库是 GitHub Pages 静态站点。添加此 Gemfile 的作用：
# 1. Pages 构建使用这里声明的依赖版本（与 Pages 官方内置环境一致）；
# 2. GitHub 依赖图 / Dependabot 基于本清单重新解析依赖，
#    可放宽版本范围的依赖（如 nokogiri、rexml）会解析到
#    已修复安全漏洞的最新补丁版，从而消除既有的安全告警。
source "https://rubygems.org"

# GitHub Pages 官方最新版本：https://github.com/github/pages-gem
gem "github-pages", "~> 232", group: :jekyll_plugins

# Ruby 3 起不再内置 webrick，本地 jekyll serve 需要
gem "webrick", "~> 1.8"
