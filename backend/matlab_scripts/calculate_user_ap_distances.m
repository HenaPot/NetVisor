function dist_matrix = calculate_user_ap_distances(aps, user_positions)
[n_users, ~, n_steps] = size(user_positions);
n_aps = length(aps);
dist_matrix = zeros(n_aps, n_users, n_steps);

for ap_idx = 1:n_aps
    if iscell(aps(ap_idx).position)
        ap_pos = aps(ap_idx).position{1};  % extract from cell
    else
        ap_pos = aps(ap_idx).position;
    end
    ap_pos = ap_pos(:)';          % make row
    ap_pos = ap_pos(1:2);         % take x,y
    for t = 1:n_steps
        user_coords = squeeze(user_positions(:, :, t));
        if size(user_coords,2) ~= 2
            user_coords = user_coords';
        end
        diffs = user_coords - ap_pos;
        dist_matrix(ap_idx, :, t) = sqrt(sum(diffs.^2, 2));
    end
end
end
