export const scrollToSection = (id: string, navigate?: (path: string) => void) => {
  const hash = window.location.hash || "";
  const isLanding = hash === "" || hash === "#" || hash === "#/";

  const doScroll = () => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!isLanding && navigate) {
    navigate("/");
    window.setTimeout(doScroll, 200);
    return;
  }

  doScroll();
};
