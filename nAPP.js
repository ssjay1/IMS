
/* Template for a row in the components table. */
var rowTemplate = "" +
	"<tr>" +
		"<td><input type='checkbox' class='componentSelected'></td>" +
		"<td><input type='text' class='componentDeviceId form-control' value='new' readonly></td>" +
        "<td><input type='text' class='componentId form-control' value='new' readonly></td>" +
		"<td><input type='text' class='componentType form-control'></td>" +
		"<td><input type='text' class='componentLabel form-control'></td>" +
		"<td><input type='text' class='componentSerialNumber form-control'></td>" +
		"<td><input type='text' class='componentState form-control'></td>" +
		"<td><input type='text' class='componentCost form-control'></td>" +
		"<td><input type='text' class='componentDeliveryDate form-control'></td>" +
		"<td>" +
			"<div class='btn-toolbar' role='toolbar' aria-label='Toolbar with button groups'>" +
				"<div class='btn-group mr-2' role='group' aria-label='First group'>" +
					"<button id='delRow' type='button' class='componentDelete btn btn-sm'><i class='fas fa-trash'></i></button>" + 
				"</div>" + 
			"</div>" + 
		"</td>" + 
	"</tr>";

/**
 * JQuery entry point.
 */
$(document).ready(function() {

	/* Array of devices to be displayed. */
    let devices;

    /* Index of current device being displayed. */
    let deviceIndex = 0;

	/**
	 * Displays a blank device form for entry of a new device.
	 * @returns {undefined}
	 */
    function NewDevice() {
		
		/* The number of rows of components being displayed on the form. */
        let numberOfRows;
		
		/* Clear form fields (some will have default value set to 'new'. */
        $("#deviceID").val("new");
        $("#location").val("");
        $("#user").val("");
        $("#purchaseID").val("");
        $("#supplier").val("");
        $("#deviceIndex").html("New");
		for (numberOfRows = $("#componentsTable tbody tr").length; numberOfRows > 0; --numberOfRows) {
            ComponentTableDelRow($("#componentsTable tr:last"), false);
        }
        ComponentTableNewRow();
		
    }

	/**
	 * Adds the currently displayed device 
	 to the database.
	 * @returns {undefined}
	 */
    function AddDevice() {

        /* Counter/index variable. */
        let i = 0;

        /* Start json string. */
        let json = '{' ;

        /* Add main device attributes to json string. */    
        json += '"DeviceID":"' + $("#deviceID").val() + '", ';
        json += '"Location":"' + $("#location").val() + '", ';
        json += '"User":"' + $("#user").val() + '", ';
        json += '"PurchaseID":"' + $("#purchaseID").val() + '", ';
        json += '"Supplier":"' + $("#supplier").val() + '", '; 

        /* Add components to json string... */    
        json += '"Components": ['; 
		
		/* For each component... */
        $("#componentsTable > tbody > tr").each(function() {
			
			/* If this is not the first component being added, include a separating comma. */
            if (i > 0) {
                json += ',';
            }
			
			/* Start component's JSON string. */
            json += '{';
			
			/* Add component properties to its JSON string. */
            json += '"ComponentID":"' + $(this).find(".componentId").val() + '", ';
            json += '"DeviceID":"' + $("#deviceID").val() + '", ';
            json += '"Type":"' + $(this).find(".componentType").val() + '", ';
            json += '"Label":"' + $(this).find(".componentLabel").val() + '", ';
            json += '"SerialNumber":"' + $(this).find(".componentSerialNumber").val() + '", ';
            json += '"State":"' + $(this).find(".componentState").val() + '", ';
            json += '"Cost":"' + $(this).find(".componentCost").val() + '", ';
            json += '"DeliveryDate":"' + $(this).find(".componentDeliveryDate").val() + '"';
			
			/* End component's JSON string. */
            json += '}';

            /* Increment i. */
            i++;
			
        });

        /* Close components array. */    
        json += ']'; 

        /* Close json string. */    
        json += '}';

		/* (TODO) remove diagnostic code showing JSON string being sent to server. */
        console.log("Sending new device: " + json);

		/* Send JSON string to server. */
        $.post('add_device.php', {'json' : json}, function(data) {
			
			/* (TODO) remove diagnostic code. */
			ShowDiag(data);
			
			/* Note result of removal. */
			let result = JSON.parse(data);
			
			/* If added device, update display. */
			if (result.NumberAdded === 1) {
				GetDevices(deviceIndex.length);
			}
			
			/* Otherwise indicate failed to add device. */
			else {
				alert("Error adding device: " + json + ".");
			}
					
        });
		
    }
     
	/**
	 * Removes the specified device from the database. Specifically, removes the first device that
 	 * matches the search value from the database.
	 * @param value The search value to be used to identify the targeted device. It will be matched
	 * against all fields of a device until a match is found.
	 * @returns {undefined}
	 */
    function RemoveDevice(value) {
		
		/* Index of device to be removed. */
		let removeIndex;
		
		/* Mongo ID of device to be removed. */
		let id;
		
		/* Find first device that matches the specified value. */
		removeIndex = FindDevice(value);
		
		/* If a matching device was found... */
		if (removeIndex !== undefined) {
			
			/* Note MongoDB ID of found device. */
			id = devices[removeIndex]._id;
			
			/* Prompt for confirmation to delete specified device. If confirmed... */
			if (confirm("Delete device: " + devices[removeIndex].DeviceID + " with Mongo ID: " + devices[removeIndex]._id.$oid + "?\nMatched: " + value + ".")) {
				
				/* Remove device from database. */
				$.post('remove_device.php', {'id' : id}, function(data) {
					
					/* Note result of removal. */
					let result = JSON.parse(data);
					
					/* If removed device, update display. */
					if (result.NumberDeleted === 1) {
						GetDevices(deviceIndex - 1);
						ShowDiag(data);
					}
					
					/* Otherwise indicate failed to remove device. */
					else {
						alert("Error deleting devise with Mongo ID" + id.$oid + " that matched search value: " + value + ".");
					}
					
				});  
			}

		}
		
		/* Otherwise note device not found. */
		else {
			alert("Device matching search value: " + value + " not found.");
		}

    }
    
	/**
	 * Gets all devices from the database and loads it into the devices array. Shows the device at
	 * the specified index.
	 * @param index Index of the device to be displayed when the function returns. If a valid index
	 * is not specified, shows the device at the current device index.
	 */
    function GetDevices(index) {
		
		/* (TODO) remove diagnostic code. */
		console.log("Retrieving list of devices.");
		
		/* Get list of devices from server,,. */
        $.post("get_devices.php", function(data) {
			
			/* (TODO) remove diagnostic code. */
            // ShowDiag(devices);
			
			/* Populate the devices array, */
            devices = JSON.parse(data);
			
			/* (TODO) remove diagnostic code. */
		    console.log("Retrieved " + devices.length + " devices.");
		
			/* Show current device. */
            ShowDevice(index);
			
        });
		
    }

	/**
	 * Searches for the nth device that matches the specified search value in the array of devices.
	 * @param value The value being searched for in a device. Will be tested against all attributes
	 * of a device until the desired match is found.
	 * @param n Indicates which matching device to return. If not specified or invalid (not a
	 * number), assumed to be the first device.
	 * @return Returns the index of the nth device that matches the specified value.
	 */
    function FindDevice(value, n) {
		
		/* Index / counter variables. */
		let i, j, matchIndex = 0;
		
		/* Index of found device. */
		let foundIndex = undefined;
		
		/* If the value of n is invalid, set it to 1. */
		if (typeof n !== 'number') {
			n = 1;
		}
		
		/* For each device in the device array... */
        for(i = 0; i < devices.length; ++i) {
			
			/* If the specified value matches a value from the current device, note its index. */
            if ((value === devices[i].DeviceID) ||
				(value === devices[i].Location) ||
                (value === devices[i].User) ||
                (value === devices[i].PurchaseID) ||
                (value === devices[i].Supplier)
                ) {
                ++matchIndex;
            }
			
			/* Otherwise if specified value is possibly a MongoID, and matches the Mongo ID of the
 			 * current device, note its index.
			 */
			else if ((typeof value === 'string') && (value === devices[i]._id.$oid)) {
                ++matchIndex;
			}

			/* Otherwise if specified value matches a value from one of the device's components,
			 * note its index.
			 */
			else {
                for (key in devices[i].Components) {            
                    if (devices[i].Components.hasOwnProperty(key)) {
                        if ((value === devices[i].Components[key].ComponentID) ||
							(value === devices[i].Components[key].SerialNumber) ||
                            (value === devices[i].Components[key].Cost) ||
                            (value === devices[i].Components[key].DeliveryDate)
							) {
							++matchIndex;
							break;
						}
                    }
                }
            }
			
			/* If desired device found note its index and end search. */
			if (matchIndex === n) {
				foundIndex = i;
				break;
			}
			
        }
		
		/* Return found index. */
		return foundIndex;
		
    }

	/**
	 * Shows the device at the specified index in the devices array. If no index is specified,
	 * shows the device at the current device index in the device array.
	 * @param index The index of the device to be displayed (0 indexed).
	 * @returns {undefined}
	 */
    function ShowDevice(index) {
		
		/* The current number of rows in the components table. */
        let numberOfRows;
		
		/* Reference to a row in the components table. */
        let row;
		
		/* Counter / index variable. */
        let i;
		
		/* The number of components to be displayed in the components table. */
        let numberOfComponents = 0;
		
		/* If a valid index specified, note it. */
		if (typeof index == 'number') {
			deviceIndex = index;
		}
		
		/* Ensure device index in correct range to show record. */
		if (deviceIndex < 0) {
			deviceIndex = 0;
		}
		else if (deviceIndex >= devices.length) {
			deviceIndex = devices.length - 1;
		}
		
		/* (TODO) remove diagnostic code. */
        console.log("Showing device: " + devices[deviceIndex].DeviceID + " at index: " + deviceIndex + " with MongoID: " + devices[deviceIndex]._id.$oid + ".");
		ShowDiag(devices[deviceIndex]);
		
		/* Display device index of device being viewed. */
        $("#deviceIndex").html((deviceIndex + 1) + '/' + devices.length + " <i class='fas fa-search'></i>");
		
		/* Load device information into the form. */
        $("#mongoID").val(devices[deviceIndex]._id.$oid);
        $("#deviceID").val(devices[deviceIndex].DeviceID);
        $("#location").val(devices[deviceIndex].Location);
        $("#user").val(devices[deviceIndex].User);
        $("#purchaseID").val(devices[deviceIndex].PurchaseID);
        $("#supplier").val(devices[deviceIndex].Supplier);
		
		/* Determine number of rows being displayed in the components table. */
        numberOfRows = $("#componentsTable tbody tr").length;

		/* Count number of components for the device currently being displayed. */
        for (key in devices[deviceIndex].Components) {            
            if (devices[deviceIndex].Components.hasOwnProperty(key)) {
                numberOfComponents++;
            }
        }
		
		/* Ensure number of rows in components table matches number of components in the device currently being displayed. */
        for (; numberOfRows < numberOfComponents; ++numberOfRows) {
            ComponentTableNewRow();
        } 
        for (; numberOfRows > numberOfComponents; --numberOfRows) {
            ComponentTableDelRow($("#componentsTable tbody tr:last", false));
        }
		
		/* Initialise counter / index variable. */
		i = 0;

		/* For each component to be displayed... */
        for (key in devices[deviceIndex].Components) {            
            if (devices[deviceIndex].Components.hasOwnProperty(key)) {

				/* (TODO) correct code below to use "tbody" and "i" instead of "(i+2)".
				/* Select row that will display component's information. */
                row = $("#componentsTable tbody tr:nth-child(" + (i + 2) + ")");
                // row = $("#componentsTable tbody tr:nth-child(" + i + ")");
				
				/* Display component's other properties. */
				row.find(".componentDeviceId").val(devices[deviceIndex].Components[key].DeviceID);
                row.find(".componentId").val(devices[deviceIndex].Components[key].ComponentID);
                row.find(".componentType").val(devices[deviceIndex].Components[key].Type);
                row.find(".componentLabel").val(devices[deviceIndex].Components[key].Label);
                row.find(".componentSerialNumber").val(devices[deviceIndex].Components[key].SerialNumber);
                row.find(".componentState").val(devices[deviceIndex].Components[key].State);
                row.find(".componentCost").val(devices[deviceIndex].Components[key].Cost);
                row.find(".componentDeliveryDate").val(devices[deviceIndex].Components[key].DeliveryDate);
				
				/* Increment counter / index variable. */
                ++i;
				
            }
        }
		
    }

	/**
	 * Sends updates for the device currently being viewed to the server.
	 * @returns {undefined}
	 */
    function UpdateDevice() {

        /* Counter/index variable. */
        let i = 0;

        /* JSON string containing updated information to send to server. */
        let json;

		/* Currently displayed device ID. */
		let deviceID = $("#deviceID").val();

        /* Start JSON string. */
        json = '{';

        /* Add displayed device properties to json string. */    
        json += '"DeviceID":"' + $("#deviceID").val() + '", ';
        json += '"Location":"' + $("#location").val() + '", ';
        json += '"User":"' + $("#user").val() + '", ';
        json += '"PurchaseID":"' + $("#purchaseID").val() + '", ';
        json += '"Supplier":"' + $("#supplier").val() + '", '; 

        /* Add components to json string. */    
        json += '"Components": ['; 

		/* For each component in the component table... */
        $("#componentsTable > tbody > tr").each(function() {

			/* If this is not the first component being added, include a separating comma. */
            if (i > 0) {
                json += ', ';
            }

            /* Add start of component's JSON string. */
            json += '{';

            /* Add component's properties to json string. */    
            json += '"ComponentID":"' + $(this).find(".componentId").val() + '", ';
            json += '"DeviceID":"' + $("#deviceID").val() + '", ';
            json += '"Type":"' + $(this).find(".componentType").val() + '", ';
            json += '"Label":"' + $(this).find(".componentLabel").val() + '", ';
            json += '"SerialNumber":"' + $(this).find(".componentSerialNumber").val() + '", ';
            json += '"State":"' + $(this).find(".componentState").val() + '", ';
            json += '"Cost":"' + $(this).find(".componentCost").val() + '", ';
            json += '"DeliveryDate":"' + $(this).find(".componentDeliveryDate").val() + '"';

            /* Add end of components to json string. */
            json += '}';

            /* Increment i. */
            i++;
			
        });

        /* Close components array. */    
        json += ']'; 

        /* Close json string. */    
        json += '}';

		/* (TODO) remove diagnostic code showing JSON string being sent to server. */
        console.log("Updating device: " + deviceID + ", Mongo ID: " + devices[deviceIndex]._id.$oid + " using JSON: " + json);

		/* Send JSON string to server. */
        $.post('update_device.php', {'json' : json , 'id' : devices[deviceIndex]._id.$oid}, function(data) {
			
			/* Note result of update. */
			let result = JSON.parse(data);
			
			/* If updated device, update display. */
			if (result.NumberUdpated === 1) {
				GetDevices();
			}
			
			/* Otherwise indicate failed to update device. */
			else {
				alert("Error updating device: " + deviceID + ", Mongo ID: " + devices[deviceIndex]._id.$oid + ".");
			}
					
        });
		
    }

    /**
     * Appends a new blank row to the end of the components table.
     * @returns {undefined}
     */
    function ComponentTableNewRow() {
		
		/* Append a row to the components table using the row template. */
        $("#componentsTable").append(rowTemplate);
        let row = $("#componentsTable tr:last");

        /* Add s click handler to the "#delRow" button in the new row. */
        row.find("#delRow").click(function() {
            ComponentTableDelRow($(this));
        });   

        row.find(".moveRec").click(function() {
            moveComponent($(this));
        }); 

        return row;

    }

    /**
     * Deletes the row in the components table that contains this specified DOM element.
	 * @param element Reference to a DOM element contained in the row to be deleted (usually the delete button being clicked).
	 * @param confirm Boolean indicating that an alert should pop up requesting confirmation before the delete is done. If true
	 * generates the popup, otherwise silently deletes the row.
     * @returns {undefined}
     */
    function ComponentTableDelRow(element, confirmDelete) {
		
		/* If a popup should confirm the deletion of the row... */
        if (confirmDelete) {
			
			/* Prompt for confirmation. If confirmed, delete the row. */
            if (confirm("Are you sure you want to delete this row?")) {
                element.closest("tr").remove();
            } 
			
        }
		
		/* Otherwise silently delete the row. */
		else {
            element.closest("tr").remove();
        }
		
    }
    
    function ComponentTableEditRow(){
        
        $('#componentsTable :input').prop('readonly', false);
       
    }

	/**
	 * Shows diagnostic data in the result box.
	 * @param data The diagnostic data to be shown.
	 * @returns {undefined}
	 */
    function ShowDiag(data) {
		
		/* Variable holding diagnostic data. */
        let d = '';

		/* Convert specified data into a JSON string (pretty printed). */
        try {
            d = JSON.stringify(data,null,2);
        } 
		
		/* If error, note reference to raw data. */
        catch (e) {
            d = data;
        }
		
		/* Display diagnostic data in the result box. */
        $('#result').html('Data: <pre>' + d + '</pre>');
		
    }

    function searchData(term) {
        let json = term;
        $.get("search_form.php", {"json":json},function(data) {
            alert("sending: " + json);
            devices = JSON.parse(data);
            deviceIndex = 0;
            console.log(devices);
            ShowDevice(deviceIndex);
        });
    }



    function addComponent(DeviceID, compArray) {
        console.log('Adding component: ' + compArray.id + ' to device: ' + DeviceID);
        $.post('add_component.php', {'comp':compArray , 'ndid':ndid}, function(data) {
            devices = JSON.parse(data);
            for(i = 0; i < devices.length; ++i) {
                if (devices[i].DeviceID == ndid) {
                    deviceIndex = i;
                    break;
                }
            }
            ShowDevice(deviceIndex);
        })
    }

    function removeComponent(deviceID, componentID) {
        console.log('Removing component: ' + componentID + ' from device: ' + deviceID);
        $.post('remove_component.php', {'compId':componentID , 'did':deviceID}, function(data) {
            console.log(data);
        });
    }

    /* TODO: make it able to move multiple at once. */
    function moveComponent(element) {
        let row = element.closest("tr");
        let mIndex = row.find('.moveIndex');
        if (mIndex.is(':hidden')) {
            mIndex.show();            
        } else if (mIndex.is(':visible')) {
            if (devices[deviceIndex].DeviceID == mIndex.val()) {
                alert("The component is already here!");
                mIndex.hide(); 
            } else if (mIndex.val() == "") {
                mIndex.hide();
            } else {
                if (confirm("Are you sure you wish to move this component?")) {
                    let compArray = {
                        id: row.find('.componentId').val(),
                        deviceID: row.find('.componentDeviceId').val(),
                        type: row.find('.componentType').val(),
                        label: row.find('.componentLabel').val(),
                        serialNumber: row.find('.componentSerialNumber').val(),
                        state: row.find('.componentState').val(),
                        cost: row.find('.componentCost').val(),
                        deliveryDate: row.find('.componentDeliveryDate').val()
                    }
                    cdid = $('#deviceID').val();
                    ndid  = mIndex.val();
                    mIndex.val('');
                    console.log('Moving component: ' + compArray['id'] + ' to Device: ' + ndid + '. Details: ' + JSON.stringify(compArray));
                    removeComponent(cdid, compArray.id);
                    addComponent(ndid, compArray);                    
                } else {
                    mIndex.hide();
                }
            }
            
        }
        
    }

	/* Add click handler to the select all components checkbox. */
	$("#selectAllComponents").change(function() {
		
		/* Note reference to the select all components checkbox. */
		let selectAllComponents = $(this);
		
		/* For each component in the component table... */
        $("#componentsTable > tbody > tr").each(function() {
			
			/* Set component's selected checkbox to the select all components checked value. */
			$(this).find(".componentSelected").prop('checked', selectAllComponents.prop('checked'));
			
		});

	});

    /* Add click handler to newComponent button. */
    $("#newComponent").click(function() {
        ComponentTableNewRow();
    });

    /* Add click handler to save button. */
    $("#saveDevice").click(function() {
		
		/* (TODO) merge AddDevice() and UpdateDevice() into one function SaveDevice() and include
		 * logic below to choose which php to send request to.
		 */
        if ($("#deviceIndex").html() == "New") {
            alert("Saving new device");
            AddDevice();
        } else {
            alert("Updating device");            
            UpdateDevice();
        }
		
    });

    /* Add click handler to the cancel button. */
    $("#cancelChanges").click(function() {
        ShowDevice();
    });

    /* Add click handlers to the next device button. */
    $("#nextDevice").click(function() {
        if (deviceIndex >= (devices.length - 1)) {
            alert("You are at the last device");
        } else {
            ShowDevice(++deviceIndex);
        }
    });

    /* Add click handler to the previous device button. */    
    $("#previousDevice").click(function() {
        if (deviceIndex <= 0) {
            alert("You are at the first device");
        } else{
            ShowDevice(--deviceIndex);
        }
    });

    /* Add click handler to the device index button. */
    $("#deviceIndex").click(function() {
        if ($('#newIndex').is(':hidden')) {
			$('#newIndex').show();
			$("#deviceIndex").html("<i class='fas fa-search'></i>");
		}else if ($('#newIndex').is(':visible')) {
            let recIndex ;
            recIndex =+ $('#newIndex').val();
            recIndex = parseInt(recIndex) - 1;
            if (recIndex < 0) {
                recIndex = 0;
            } else if (recIndex >= devices.length) {
                recIndex = devices.length - 1;
            }
            deviceIndex = recIndex;
			ShowDevice(deviceIndex);
            $('#newIndex').hide();
		}
    });

    /* Add click handler to the first device button. */
    $("#firstDevice").click(function() {
        deviceIndex = 0;
        ShowDevice(deviceIndex);
    });

    /* Add click handler to the last device button. */
    $("#lastDevice").click(function() {
        deviceIndex = devices.length - 1;
        ShowDevice(deviceIndex);
    });

	/* Add click handler to the delete device button. */
    $("#deleteDevice").click(function() {
        if ($("#deviceIndex").html() == "New") {
            alert("This is a new device!");
        } else {
            RemoveDevice($('#mongoID').val());
        }
    });

    /* Add click handler to the search form button. */
    $("#searchForm").click(function() {
        $('#unfilter').show(); 
        let term = $("#json").val();
        searchData(term);
    });

	/* Add click handler to the search button. */
    $("#search").click(function() {
        let term = $("#json").val();
        FindDevice(term);

    });

    /* Add click handler to the unfilter button. */
    $('#unfilter').click(function() {
        $('#unfilter').hide();
        GetDevices();
    })

    /* Add click handler to the new device button. */
    $("#addDevice").click(function() {
        NewDevice();
    });

    /* Function to delete row with parameter i will name later. */
    $("#delRow").click(function() {
        ComponentTableDelRow($(this), true);
    });

    $(".moveRec").click(function() {
        moveComponent($(this));
    });
    
    $("#editRow").click(function(){
        ComponentTableEditRow($(this));
    });

    GetDevices();   
});

