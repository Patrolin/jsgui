import { makeComponent, span, tabs, TabsOption } from "../../../jsgui/out/jsgui.mts";

export const tabsPage = makeComponent("tabsPage", function() {
    const [state, setState] = this.useState({selectedTab: 0 as string | number});

    // tabs
    const tabOptions: TabsOption[] = [
        {label: "foo"},
        {label: "bar"},
        {id: "customId", label: "zoo"},
    ];
    this.append(tabs({
        options: tabOptions,
        selectedId: state.selectedTab,
        setSelectedId: (newId) => setState({selectedTab: newId}),
    }));

    // content
    const selectedTab = tabOptions.find((option, i) => (option.id ?? i) === state.selectedTab);
    if (selectedTab) {
        this.append(span(selectedTab.label, {key: state.selectedTab}))
    }
});
