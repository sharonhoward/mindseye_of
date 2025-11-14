// See https://observablehq.com/framework/config for documentation.
export default {
  // The app’s title; used in the sidebar and webpage titles.
  title: "In Her Mind's Eye",

  // The pages and sections in the sidebar. If you don’t specify this option,
  // all pages will be listed in alphabetical order. Listing pages explicitly
  // lets you organize them into sections and have unlisted pages.
  // pages: [
  //   {
  //     name: "Examples",
  //     pages: [
  //       {name: "Dashboard", path: "/example-dashboard"},
  //       {name: "Report", path: "/example-report"}
  //     ]
  //   }
  // ],

  // Content to add to the head of the page, e.g. for a favicon:
  head: '<link rel="icon" href="mindseye.png" type="image/png" sizes="32x32">',

  // The path to the source root.
  root: "src",

  // Some additional configuration options and their defaults:
  // theme: "default", // try "light", "dark", "slate", etc.
  //style: "./styles.css", // doesn't work here but does work in page yaml so.
  header: 
  "<navbar><span class='navbar-title'><a href='https://mindseye.sharonhoward.org/'>In Her Mind's Eye</a></span> <span class='menu-text'><a href='https://mindseye.sharonhoward.org/dashboards/'>Dashboards</a></span></navbar>", // hardcode links...
  
   footer: "<a href='https://sharonhoward.org'>Sharon Howard</a> | Unless otherwise stated, code and visualisations are <a href='http://creativecommons.org/licenses/by-sa/4.0/'>CC BY SA 4.0</a>.", // what to show in the footer (HTML)
   
   sidebar: false, // whether to show the sidebar
  // toc: true, // whether to show the table of contents
   pager: false, // whether to show previous & next links in the footer
   
   output: "docs",
  // search: true, // activate search
  // linkify: true, // convert URLs in Markdown to links
  // typographer: false, // smart quotes and other typographic improvements
   preserveExtension: true, // drop .html from URLs
  // preserveIndex: false, // drop /index from URLs
};
