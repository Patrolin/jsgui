const root = makeComponent(function root() {
  this.append(
    router({
      routes: {
        "/": {
          component: () => mainPage(),
        },
      },
      notFoundRoute: {
        component: () => notFoundPage(),
      },
    })
  );
});
const notFoundPage = makeComponent(function notFoundPage() {
  this.append(span("Page not found"));
});
renderRoot(root());
