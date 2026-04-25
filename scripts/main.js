let activePanel = null; // Tracks which panel is 

runOnStartup(async runtime => {
    // List your 4 button object names here
    const buttonNames = ["AchievementBtn", "SocialBtn", "PlatformBtn", "StorageBtn", "DeviceBtn", "LeaderboardBtn", "AdBtn", "RemoteBtn", "GameBtn", "PlayerBtn", "PaymentBtn", "BackBtn", "ShowBannerBtn", "HideBannerBtn", "ShowInterstitialBtn", "ShowRewardBtn", "CheckAdBlockBtn", "ShareBtn", "JoinBtn", "FavouriteRewardBtn", "HomeRewardBtn", "InviteBtn", "PostBtn", "FavouriteBtn", "HomeBtn", "RateBtn", "AuthBtn", "UnlockBtn", "GetListBtn", "NativePopUpBtn", "LoadDataBtn", "SaveDataBtn", "DeleteDataBtn","GetAllGamesBtn","GetGameByIDBtn","GetServerTimeBtn","ConsumeBtn","GetCatalogBtn","GetPurchaseBtn","PurchaseBtn"];
    const mouse = runtime.objects.Mouse;
    runtime.addEventListener("tick", () => {
        const mouseX = mouse.getMouseX(0); // 0 is the layer index
        const mouseY = mouse.getMouseY(0);

        for (const name of buttonNames) {
            const btnType = runtime.objects[name];
            if (!btnType) continue;

            const instances = btnType.getAllInstances();

            for (const inst of instances) {
                if (activePanel !== null && inst.z < activePanel.z) {
                    if (inst.animationName !== "Normal") inst.setAnimation("Normal");
                    continue;
                }
                // Check if mouse is over this specific button instance
                if (inst.containsPoint(mouseX, mouseY)) {
                    // Only set animation if it's not already playing to save performance
                    if (inst.animationName !== "Hover") {
                        inst.setAnimation("Hover");
                    }

                    // Handle Click (Primary mouse button)
                    if (runtime.mouse.isMouseButtonDown(0)) {
                        handleAction(name, runtime);
                    }
                } else {
                    if (inst.animationName !== "Normal") {
                        inst.setAnimation("Normal");
                    }
                }
            }
        }
    });
    let isDragging = false;
    let startY = 0;
    let initialScrollY = 0;
    let activeScrollPanel = null;

    const panelConfigs = {
        "AdsPanel": { minY: 100, maxY: 352 },
        "SocialPanel": { minY: 100, maxY: 352 },
        "LeaderboardsPanel": { minY: 180, maxY: 280 },
        "PlatformPanel": { minY: -120, maxY: 532 },
        "PaymentsPanel": { minY: 315, maxY: 410 }
        // Add other panels here
    };

    runtime.addEventListener("mousedown", e => {
        const allPanels = ["AdsPanel", "SocialPanel", "LeaderboardsPanel", "PlatformPanel", "PaymentsPanel"];

        activeScrollPanel = allPanels
            .map(name => runtime.objects[name]?.getFirstInstance())
            .find(inst => inst && inst.isVisible);

        if (activeScrollPanel) {
            isDragging = true;
            // Use your origin mouse logic
            startY = runtime.objects.Mouse.getMouseY(0);
            initialScrollY = activeScrollPanel.y;
        }
    });

    runtime.addEventListener("mousemove", e => {
        if (!isDragging || !activeScrollPanel) return;

        const mouse = runtime.objects.Mouse;
        const currentMouseY = mouse.getMouseY(0);
        const deltaY = currentMouseY - startY;
        const config = panelConfigs[activeScrollPanel.objectType.name] || { minY: 0, maxY: 500 };

        // 1. Store the position BEFORE moving
        const oldY = activeScrollPanel.y;

        // 2. Calculate and apply the new clamped position to the parent
        let newY = initialScrollY + deltaY;
        activeScrollPanel.y = Math.min(Math.max(newY, config.minY), config.maxY);

        // 3. Calculate the actual displacement (how much the parent actually moved)
        const displacementY = activeScrollPanel.y - oldY;

        // 4. Force all objects in the container to follow the displacement
        // This makes buttons, text, and icons stick to the background
        const siblings = activeScrollPanel.getOtherContainerInstances();
        for (const inst of siblings) {
            inst.y += displacementY;
        }
    });

    runtime.addEventListener("mouseup", () => {
        isDragging = false;
        activeScrollPanel = null;
    });
});

function handleAction(btnName, runtime) {
    // Define what each button does here
    switch (btnName) {
        case "AchievementBtn":
            togglePanel(runtime, "AchievementPanel");
            console.log("Playgama: Opening Achievements...");
            break;
        case "SocialBtn":
            togglePanel(runtime, "SocialPanel");
            break;
        case "PlatformBtn":
            togglePanel(runtime, "PlatformPanel");
            console.log("Playgama: Getting Platform Info...");
            break;
        case "StorageBtn":
            togglePanel(runtime, "StoragePanel");
            console.log("Playgama: Loading Cloud Save...");
            break;
        case "DeviceBtn":
            togglePanel(runtime, "DevicePanel");
            break;
        case "LeaderboardBtn":
            togglePanel(runtime, "LeaderboardsPanel");
            console.log("Playgama: Showing Global Rankings...");
            break;
        case "AdBtn":
            togglePanel(runtime, "AdsPanel");
            break;
        case "RemoteBtn":
            togglePanel(runtime, "RemoteConfigPanel");
            break;
        case "GameBtn":
            togglePanel(runtime, "GamePanel");
            break;
        case "PlayerBtn":
            togglePanel(runtime, "PlayerPanel");
            break;
        case "PaymentBtn":
            togglePanel(runtime, "PaymentsPanel");
            console.log("Shop: Opening Checkout...");
            break;
        case "BackBtn":
            togglePanel(runtime, null); // Hides all panels and clears activePanel
            activePanel = null;
            break;
    }
    // Add this helper function at the bottom of your script
    function setGroupVisible(parentInst, isVisible) {
        if (!parentInst) return;

        // 1. Set the parent visibility
        parentInst.isVisible = isVisible;

        // 2. Get all container siblings (backbtn, dimmer, etc.)
        const siblings = parentInst.getOtherContainerInstances();

        // 3. Set all siblings to the same visibility
        for (const sibling of siblings) {
            sibling.isVisible = isVisible;
        }
    }

    function togglePanel(runtime, name) {
        // 1. Get all objects that act as Panels
        // If they share a Name (e.g. "MainPanel"), use that. 
        // Otherwise, we loop through your panel object types.
        const panelTypes = ["DevicePanel", "GamePanel", "RemoteConfigPanel", "AdsPanel", "SocialPanel", "PlayerPanel", "AchievementPanel", "StoragePanel", "LeaderboardsPanel", "PlatformPanel", "PaymentsPanel"];

        const backBtn = runtime.objects.BackBtn.getFirstInstance();
        const topMask = runtime.objects.TopMask.getFirstInstance();
        backBtn.isVisible = false;
        topMask.isVisible = false;
        for (const pName of panelTypes) {
            const inst = runtime.objects[pName].getFirstInstance();
            if (!inst) continue;

            if (pName === name) {
                // Show this one
                setGroupVisible(inst, true);
                inst.moveToTop(); // Ensure it's above the others
                activePanel = inst;
                backBtn.isVisible = true;
                topMask.isVisible = true;
                backBtn.moveToTop();
            } else {
                // Hide all others
                setGroupVisible(inst, false);
            }
        }
    }
}