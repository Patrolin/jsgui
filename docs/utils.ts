type MainPageSection = {
  label: string;
  id: string;
  component: ComponentFunction<[]>;
}
function getSizeLabel(size: string) {
  return size[0].toUpperCase() + size.slice(1);
}
